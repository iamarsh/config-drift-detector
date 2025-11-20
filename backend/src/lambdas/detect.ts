import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SupabaseClient } from '../shared/supabase-client.js';
import { AwsClient } from '../shared/aws-client.js';
import { createLogger } from '../shared/logger.js';
import { DetectionResult, AwsSnapshot } from '../shared/types.js';
import { computeDiff } from '../shared/utils.js';

const logger = createLogger('detect-lambda');

export const handler = async (_event: any): Promise<DetectionResult> => {
  const startTime = Date.now();

  try {
    logger.info('Starting drift detection');

    // Generate unique detection run ID for audit trail
    const detectionRunId = `detect-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const detectedBy = process.env.AWS_LAMBDA_FUNCTION_NAME || 'detect-lambda';

    logger.info({ detectionRunId, detectedBy }, 'Detection run initialized');

    // Initialize clients
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
    });
    const supabaseClient = new SupabaseClient();

    const bucketName = process.env.S3_BUCKET_NAME;
    const accountId = process.env.AWS_ACCOUNT_ID;

    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    if (!accountId) {
      throw new Error('AWS_ACCOUNT_ID environment variable is required');
    }

    // Get latest snapshot from S3
    logger.info('Fetching latest snapshot from S3');
    const { snapshot: latestSnapshot, key: snapshotKey } = await getLatestSnapshotFromS3(
      s3Client,
      bucketName
    );

    if (!latestSnapshot) {
      throw new Error('No snapshots found in S3');
    }

    logger.info({ timestamp: latestSnapshot.timestamp, snapshotKey }, 'Latest snapshot retrieved');

    // Get baseline from Supabase
    logger.info('Fetching baseline from Supabase');
    const baseline = await supabaseClient.getLatestBaseline(accountId);

    // If no baseline exists, create one and return
    if (!baseline) {
      logger.info('No baseline found, creating initial baseline');
      await supabaseClient.upsertBaseline(accountId, latestSnapshot);

      const duration = Date.now() - startTime;
      logger.info({ duration }, 'Baseline created successfully');

      return {
        success: true,
        driftCount: 0,
        drifts: [],
        baselineExists: false,
        timestamp: latestSnapshot.timestamp,
      };
    }

    logger.info(
      {
        baselineTimestamp: baseline.timestamp,
        baselineResourceCount: baseline.resources.length,
      },
      'Baseline retrieved'
    );

    // Compute drift
    const drifts = computeDiff(baseline, latestSnapshot);

    logger.info({ driftCount: drifts.length }, 'Drift computation complete');

    // Insert drift events into Supabase with audit metadata
    if (drifts.length > 0) {
      logger.info('Inserting drift events into Supabase');

      for (const drift of drifts) {
        // Enrich drift event with audit trail metadata
        const enrichedDrift = {
          ...drift,
          detectedBy,
          detectionRunId,
          snapshotKey: snapshotKey || undefined,
        };

        await supabaseClient.insertDriftEvent(enrichedDrift);
      }

      logger.info({ count: drifts.length, detectionRunId }, 'All drift events inserted with audit metadata');
    }

    const duration = Date.now() - startTime;

    logger.info(
      {
        driftCount: drifts.length,
        duration,
      },
      'Drift detection completed successfully'
    );

    return {
      success: true,
      driftCount: drifts.length,
      drifts,
      baselineExists: true,
      timestamp: latestSnapshot.timestamp,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      {
        error,
        duration,
      },
      'Drift detection failed'
    );

    return {
      success: false,
      driftCount: 0,
      drifts: [],
      baselineExists: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

async function getLatestSnapshotFromS3(
  s3Client: S3Client,
  bucketName: string
): Promise<{ snapshot: AwsSnapshot | null; key: string | null }> {
  try {
    // Use AwsClient for paginated S3 listing (handles >1000 objects)
    const awsClient = new AwsClient();
    const allObjects = await awsClient.listAllS3Objects(bucketName);

    if (allObjects.length === 0) {
      return { snapshot: null, key: null };
    }

    logger.info({ totalObjects: allObjects.length }, 'All S3 objects retrieved with pagination');

    // Sort by key (descending) to get the latest
    const sortedObjects = allObjects.sort((a, b) => {
      const keyA = a.Key || '';
      const keyB = b.Key || '';
      return keyB.localeCompare(keyA);
    });

    const latestKey = sortedObjects[0].Key;

    if (!latestKey) {
      return { snapshot: null, key: null };
    }

    logger.info({ key: latestKey }, 'Fetching latest snapshot');

    // Get the object
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: latestKey,
    });

    const getResponse = await s3Client.send(getCommand);

    if (!getResponse.Body) {
      throw new Error('Snapshot body is empty');
    }

    // Read the body
    const bodyString = await getResponse.Body.transformToString();
    const snapshot: AwsSnapshot = JSON.parse(bodyString);

    return { snapshot, key: latestKey };
  } catch (error) {
    logger.error({ error }, 'Failed to get latest snapshot from S3');
    throw error;
  }
}

// Direct invocation for local testing
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('Running detect lambda locally');

  handler({})
    .then((result) => {
      logger.info({ result }, 'Lambda execution completed');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      logger.error({ error }, 'Lambda execution failed');
      process.exit(1);
    });
}
