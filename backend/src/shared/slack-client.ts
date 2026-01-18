import { createLogger } from './logger.js';
import { DriftEvent, Severity } from './types.js';

const logger = createLogger('slack-client');

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export class SlackClient {
  private webhookUrl: string;

  constructor() {
    const url = process.env.SLACK_WEBHOOK_URL;

    if (!url) {
      throw new Error('SLACK_WEBHOOK_URL must be set');
    }

    this.webhookUrl = url;
    logger.info('Slack client initialized');
  }

  async sendAlert(drift: DriftEvent): Promise<void> {
    try {
      logger.info(
        {
          resourceId: drift.resourceId,
          severity: drift.severity,
        },
        'Sending Slack alert'
      );

      const blocks = this.buildAlertBlocks([drift]);
      await this.sendMessage(blocks);

      logger.info('Slack alert sent successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to send Slack alert');
      throw error;
    }
  }

  async sendBatchAlerts(drifts: DriftEvent[]): Promise<void> {
    try {
      logger.info({ count: drifts.length }, 'Sending batch Slack alerts');

      if (drifts.length === 0) {
        logger.info('No drifts to alert');
        return;
      }

      const blocks = this.buildAlertBlocks(drifts);
      await this.sendMessage(blocks);

      logger.info('Batch Slack alerts sent successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to send batch Slack alerts');
      throw error;
    }
  }

  private buildAlertBlocks(drifts: DriftEvent[]): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    // Header
    const severityEmoji = this.getSeverityEmoji(drifts[0].severity);
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${severityEmoji} AWS Config Drift Detected (${drifts.length} ${drifts.length === 1 ? 'change' : 'changes'})`,
      },
    });

    // Context
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Account:* ${drifts[0].accountId}\n*Detected:* ${new Date(drifts[0].detectedAt).toLocaleString()}`,
      },
    });

    blocks.push({ type: 'divider' });

    // Individual drift details (limit to 10 for readability)
    const driftsToShow = drifts.slice(0, 10);

    for (const drift of driftsToShow) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Resource:*\n${drift.resourceId}`,
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${drift.resourceType}`,
          },
          {
            type: 'mrkdwn',
            text: `*Change:*\n${drift.changeType}`,
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${this.getSeverityEmoji(drift.severity)} ${drift.severity}`,
          },
        ],
      });
    }

    if (drifts.length > 10) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_... and ${drifts.length - 10} more changes_`,
        },
      });
    }

    blocks.push({ type: 'divider' });

    // Footer with action items
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Action Required:* Review changes in the dashboard and acknowledge if expected.',
      },
    });

    return blocks;
  }

  private getSeverityEmoji(severity: Severity): string {
    switch (severity) {
      case Severity.CRITICAL:
        return '🔴';
      case Severity.HIGH:
        return '🟠';
      case Severity.MEDIUM:
        return '🟡';
      case Severity.LOW:
        return '🟢';
      default:
        return '⚪';
    }
  }

  private async sendMessage(blocks: SlackBlock[]): Promise<void> {
    const payload = {
      blocks,
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} - ${errorText}`);
    }
  }
}
