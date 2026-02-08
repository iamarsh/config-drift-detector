import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { createLogger } from './logger.js';
import { DriftEvent, AwsSnapshot, Severity, ResourceType } from './types.js';

const logger = createLogger('supabase-client');

export class SupabaseClient {
  private client: SupabaseClientType;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    logger.info('Supabase client initialized');
  }

  async insertDriftEvent(event: DriftEvent): Promise<string> {
    try {
      logger.info(
        {
          resourceId: event.resourceId,
          resourceType: event.resourceType,
          changeType: event.changeType,
          severity: event.severity,
        },
        'Inserting drift event'
      );

      const { data, error } = await this.client
        .from('drift_events')
        .insert({
          account_id: event.accountId,
          resource_id: event.resourceId,
          resource_type: event.resourceType,
          change_type: event.changeType,
          severity: event.severity,
          detected_at: event.detectedAt,
          acknowledged: event.acknowledged,
          previous_state: event.previousState || null,
          current_state: event.currentState || null,
          // Audit trail metadata
          detected_by: event.detectedBy || null,
          detection_run_id: event.detectionRunId || null,
          snapshot_key: event.snapshotKey || null,
        })
        .select('id')
        .single();

      if (error) {
        logger.error({ error }, 'Failed to insert drift event');
        throw error;
      }

      logger.info({ id: data.id }, 'Drift event inserted');
      return data.id;
    } catch (error) {
      logger.error({ error }, 'Error inserting drift event');
      throw error;
    }
  }

  async insertDriftEventsBatch(events: DriftEvent[]): Promise<string[]> {
    try {
      const batchSize = 100;
      const insertedIds: string[] = [];

      logger.info({ totalEvents: events.length, batchSize }, 'Starting batch drift insertion');

      // Process events in batches of 100
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(events.length / batchSize);

        logger.info(
          { batchNumber, totalBatches, batchSize: batch.length },
          'Processing batch'
        );

        const batchStartTime = Date.now();

        // Transform events to database format
        const records = batch.map((event) => ({
          account_id: event.accountId,
          resource_id: event.resourceId,
          resource_type: event.resourceType,
          change_type: event.changeType,
          severity: event.severity,
          detected_at: event.detectedAt,
          acknowledged: event.acknowledged,
          previous_state: event.previousState || null,
          current_state: event.currentState || null,
          // Audit trail metadata
          detected_by: event.detectedBy || null,
          detection_run_id: event.detectionRunId || null,
          snapshot_key: event.snapshotKey || null,
        }));

        const { data, error } = await this.client
          .from('drift_events')
          .insert(records)
          .select('id');

        if (error) {
          logger.error(
            { error, batchNumber, batchSize: batch.length },
            'Failed to insert drift batch'
          );
          throw error;
        }

        const batchDuration = Date.now() - batchStartTime;
        const ids = data.map((row) => row.id);
        insertedIds.push(...ids);

        logger.info(
          {
            batchNumber,
            totalBatches,
            insertedCount: ids.length,
            batchDuration,
          },
          'Batch inserted successfully'
        );
      }

      logger.info(
        { totalInserted: insertedIds.length, batches: Math.ceil(events.length / batchSize) },
        'Batch drift insertion completed'
      );

      return insertedIds;
    } catch (error) {
      logger.error({ error, totalEvents: events.length }, 'Error in batch drift insertion');
      throw error;
    }
  }

  async getDriftEvents(
    accountId: string,
    filters?: {
      severity?: Severity[];
      resourceType?: ResourceType[];
      acknowledged?: boolean;
      limit?: number;
    }
  ): Promise<DriftEvent[]> {
    try {
      logger.info({ accountId, filters }, 'Fetching drift events');

      let query = this.client
        .from('drift_events')
        .select('*')
        .eq('account_id', accountId)
        .order('detected_at', { ascending: false });

      if (filters?.severity) {
        query = query.in('severity', filters.severity);
      }

      if (filters?.resourceType) {
        query = query.in('resource_type', filters.resourceType);
      }

      if (filters?.acknowledged !== undefined) {
        query = query.eq('acknowledged', filters.acknowledged);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ error }, 'Failed to fetch drift events');
        throw error;
      }

      const events: DriftEvent[] = (data || []).map((row) => ({
        id: row.id,
        accountId: row.account_id,
        resourceId: row.resource_id,
        resourceType: row.resource_type as ResourceType,
        changeType: row.change_type,
        severity: row.severity as Severity,
        detectedAt: row.detected_at,
        acknowledged: row.acknowledged,
        previousState: row.previous_state,
        currentState: row.current_state,
        // Audit trail metadata
        detectedBy: row.detected_by,
        detectionRunId: row.detection_run_id,
        snapshotKey: row.snapshot_key,
      }));

      logger.info({ count: events.length }, 'Drift events fetched');
      return events;
    } catch (error) {
      logger.error({ error }, 'Error fetching drift events');
      throw error;
    }
  }

  async upsertBaseline(accountId: string, snapshot: AwsSnapshot): Promise<void> {
    try {
      logger.info({ accountId, resourceCount: snapshot.resources.length }, 'Upserting baseline');

      const { error } = await this.client.from('baselines').insert({
        account_id: accountId,
        snapshot: snapshot as any,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error({ error }, 'Failed to upsert baseline');
        throw error;
      }

      logger.info('Baseline upserted successfully');
    } catch (error) {
      logger.error({ error }, 'Error upserting baseline');
      throw error;
    }
  }

  async getLatestBaseline(accountId: string): Promise<AwsSnapshot | null> {
    try {
      logger.info({ accountId }, 'Fetching latest baseline');

      const { data, error } = await this.client
        .from('baselines')
        .select('snapshot')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          logger.info('No baseline found');
          return null;
        }
        logger.error({ error }, 'Failed to fetch baseline');
        throw error;
      }

      logger.info('Baseline fetched');
      return data.snapshot as AwsSnapshot;
    } catch (error) {
      logger.error({ error }, 'Error fetching baseline');
      throw error;
    }
  }

  async markDriftAcknowledged(driftId: string): Promise<void> {
    try {
      logger.info({ driftId }, 'Marking drift as acknowledged');

      const { error } = await this.client
        .from('drift_events')
        .update({ acknowledged: true })
        .eq('id', driftId);

      if (error) {
        logger.error({ error }, 'Failed to mark drift as acknowledged');
        throw error;
      }

      logger.info('Drift marked as acknowledged');
    } catch (error) {
      logger.error({ error }, 'Error marking drift as acknowledged');
      throw error;
    }
  }
}
