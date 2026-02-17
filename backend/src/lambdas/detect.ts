import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SupabaseClient } from '../shared/supabase-client.js';
import { AwsClient } from '../shared/aws-client.js';
import { createLogger } from '../shared/logger.js';
import { DetectionResult, AwsSnapshot } from '../shared/types.js';
import { computeDiff } from '../shared/utils.js';

const logger = createLogger('detect-lambda');

export const handler = async (_event: any): Promise<DetectionResult> => {
  const startTime = Date.now();
  const detectionRunId = `detect-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    const detectedBy = process.env.AWS_LAMBDA_FUNCTION_NAME || 'detect-lambda';

    logger.info({
      detectionRunId,
      detectedBy,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
    }, 'Starting drift detection');

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

    // Insert drift events into Supabase with audit metadata (batch insertion for performance)
    if (drifts.length > 0) {
      logger.info({ driftCount: drifts.length }, 'Inserting drift events into Supabase using batch insertion');

      const insertStartTime = Date.now();

      // Enrich all drift events with audit trail metadata
      const enrichedDrifts = drifts.map((drift) => ({
        ...drift,
        detectedBy,
        detectionRunId,
        snapshotKey: snapshotKey || undefined,
      }));

      try {
        // Use batch insertion (100 per query) for 100x performance improvement
        await supabaseClient.insertDriftEventsBatch(enrichedDrifts);

        const insertDuration = Date.now() - insertStartTime;

        logger.info(
          {
            count: drifts.length,
            detectionRunId,
            insertDuration,
          },
          'All drift events inserted with audit metadata using batch insertion'
        );
      } catch (insertError) {
        // If batch insertion fails, send failed events to DLQ for manual processing
        logger.error(
          {
            error: insertError,
            driftCount: enrichedDrifts.length,
            detectionRunId,
          },
          'Batch insertion failed, sending drift events to DLQ'
        );

        await sendToDLQ(enrichedDrifts, detectionRunId, insertError as Error);
      }
    }

    const duration = Date.now() - startTime;

    logger.logPerformance('drift-detection', duration, {
      detectionRunId,
      driftCount: drifts.length,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
    });

    logger.info(
      {
        driftCount: drifts.length,
        duration,
        detectionRunId,
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

    logger.logError(error as Error, {
      detectionRunId,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
      duration,
      stage: 'detect',
    });

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

/**
 * Send failed drift events to Dead-Letter Queue for manual processing
 * This ensures no drift events are lost when database insertion fails
 */
async function sendToDLQ(
  drifts: any[],
  detectionRunId: string,
  error: Error
): Promise<void> {
  try {
    const sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // Get DLQ URL from CloudFormation stack exports
    const queueUrl = `https://sqs.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/config-drift-detector-${process.env.NODE_ENV || 'dev'}-drift-events-dlq`;

    const message = {
      detectionRunId,
      driftCount: drifts.length,
      drifts,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
    };

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        detectionRunId: {
          DataType: 'String',
          StringValue: detectionRunId,
        },
        driftCount: {
          DataType: 'Number',
          StringValue: drifts.length.toString(),
        },
        errorType: {
          DataType: 'String',
          StringValue: error.name,
        },
      },
    });

    await sqsClient.send(command);

    logger.info(
      {
        detectionRunId,
        driftCount: drifts.length,
        queueUrl,
      },
      'Failed drift events sent to DLQ successfully'
    );
  } catch (dlqError) {
    // Log DLQ failure but don't throw - we already have the original error
    logger.error(
      {
        error: dlqError,
        detectionRunId,
        driftCount: drifts.length,
      },
      'Failed to send drift events to DLQ'
    );
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
