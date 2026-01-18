import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { SupabaseClient } from '../shared/supabase-client.js';
import { createLogger } from '../shared/logger.js';
import { DetectionResult, AwsSnapshot } from '../shared/types.js';
import { computeDiff } from '../shared/utils.js';

const logger = createLogger('detect-lambda');

export const handler = async (_event: any): Promise<DetectionResult> => {
  const startTime = Date.now();

  try {
    logger.info('Starting drift detection');

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
    const latestSnapshot = await getLatestSnapshotFromS3(s3Client, bucketName);

    if (!latestSnapshot) {
      throw new Error('No snapshots found in S3');
    }

    logger.info({ timestamp: latestSnapshot.timestamp }, 'Latest snapshot retrieved');

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

    // Insert drift events into Supabase
    if (drifts.length > 0) {
      logger.info('Inserting drift events into Supabase');

      for (const drift of drifts) {
        await supabaseClient.insertDriftEvent(drift);
      }

      logger.info({ count: drifts.length }, 'All drift events inserted');
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
): Promise<AwsSnapshot | null> {
  try {
    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return null;
    }

    // Sort by key (descending) to get the latest
    const sortedObjects = listResponse.Contents.sort((a, b) => {
      const keyA = a.Key || '';
      const keyB = b.Key || '';
      return keyB.localeCompare(keyA);
    });

    const latestKey = sortedObjects[0].Key;

    if (!latestKey) {
      return null;
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

    return snapshot;
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
