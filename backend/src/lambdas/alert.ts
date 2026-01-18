import { SupabaseClient } from '../shared/supabase-client.js';
import { SlackClient } from '../shared/slack-client.js';
import { createLogger } from '../shared/logger.js';
import { AlertResult, Severity } from '../shared/types.js';

const logger = createLogger('alert-lambda');

export const handler = async (_event: any): Promise<AlertResult> => {
  const startTime = Date.now();

  try {
    logger.info('Starting alert process');

    // Initialize clients
    const supabaseClient = new SupabaseClient();
    const slackClient = new SlackClient();

    const accountId = process.env.AWS_ACCOUNT_ID;

    if (!accountId) {
      throw new Error('AWS_ACCOUNT_ID environment variable is required');
    }

    // Fetch unacknowledged HIGH and CRITICAL drifts
    logger.info('Fetching unacknowledged HIGH/CRITICAL drifts');

    const drifts = await supabaseClient.getDriftEvents(accountId, {
      severity: [Severity.HIGH, Severity.CRITICAL],
      acknowledged: false,
      limit: 50, // Limit to avoid overwhelming Slack
    });

    logger.info({ driftCount: drifts.length }, 'Drifts fetched');

    if (drifts.length === 0) {
      logger.info('No HIGH/CRITICAL unacknowledged drifts found');

      return {
        success: true,
        alertsSent: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Send Slack alerts
    logger.info({ count: drifts.length }, 'Sending Slack alerts');

    await slackClient.sendBatchAlerts(drifts);

    logger.info('Slack alerts sent successfully');

    // Optionally mark drifts as acknowledged
    // (Commented out to allow manual acknowledgment via dashboard)
    // for (const drift of drifts) {
    //   if (drift.id) {
    //     await supabaseClient.markDriftAcknowledged(drift.id);
    //   }
    // }

    const duration = Date.now() - startTime;

    logger.info(
      {
        alertsSent: drifts.length,
        duration,
      },
      'Alert process completed successfully'
    );

    return {
      success: true,
      alertsSent: drifts.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      {
        error,
        duration,
      },
      'Alert process failed'
    );

    return {
      success: false,
      alertsSent: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Direct invocation for local testing
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('Running alert lambda locally');

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
