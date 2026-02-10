import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AwsClient } from '../shared/aws-client.js';
import { createLogger } from '../shared/logger.js';
import { SnapshotResult } from '../shared/types.js';

const logger = createLogger('snapshot-lambda');

export const handler = async (_event: any): Promise<SnapshotResult> => {
  const startTime = Date.now();
  const snapshotRunId = `snapshot-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    logger.info({
      snapshotRunId,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
    }, 'Starting snapshot process');

    // Initialize clients
    const awsClient = new AwsClient();
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
    });

    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    // Get snapshot
    const snapshot = await awsClient.getAllSnapshots();

    // Generate S3 key: YYYY-MM-DD/HH-MM-SS.json
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
    const key = `${datePart}/${timePart}.json`;

    logger.info({ key, resourceCount: snapshot.resources.length }, 'Uploading snapshot to S3');

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(snapshot, null, 2),
      ContentType: 'application/json',
      Metadata: {
        accountId: snapshot.accountId,
        region: snapshot.region,
        timestamp: snapshot.timestamp,
        resourceCount: snapshot.resources.length.toString(),
      },
    });

    await s3Client.send(putCommand);

    const duration = Date.now() - startTime;

    logger.logPerformance('snapshot-collection', duration, {
      snapshotRunId,
      resourceCount: snapshot.resources.length,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
    });

    logger.info(
      {
        key,
        resourceCount: snapshot.resources.length,
        duration,
        snapshotRunId,
      },
      'Snapshot completed successfully'
    );

    return {
      success: true,
      snapshotKey: key,
      resourceCount: snapshot.resources.length,
      timestamp: snapshot.timestamp,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.logError(error as Error, {
      snapshotRunId,
      accountId: process.env.AWS_ACCOUNT_ID,
      region: process.env.AWS_REGION,
      duration,
      stage: 'snapshot',
    });

    return {
      success: false,
      resourceCount: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Direct invocation for local testing
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('Running snapshot lambda locally');

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
