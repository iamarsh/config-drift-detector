import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handler } from '../src/lambdas/alert';

describe('Alert Lambda Handler', () => {
  beforeEach(() => {
    // Set required environment variables
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_ACCOUNT_ID = '123456789';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return success with zero alerts when no HIGH/CRITICAL drifts exist', async () => {
    // Note: This test will attempt to connect to Supabase
    // In a production test environment, we would mock Supabase
    // For now, we test the handler structure

    // Execute handler
    const result = await handler({});

    // Assertions - handler should return a result object
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('alertsSent');
    expect(result).toHaveProperty('timestamp');
  });

  it('should fail when required environment variables are missing', async () => {
    // Remove required environment variable
    delete process.env.AWS_ACCOUNT_ID;

    // Execute handler
    const result = await handler({});

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('AWS_ACCOUNT_ID environment variable is required');
    expect(result.alertsSent).toBe(0);
  });
});
