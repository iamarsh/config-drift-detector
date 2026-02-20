/**
 * E2E Test Database Setup and Seeding
 *
 * This file contains utilities for seeding the test database with mock drift events
 * before running end-to-end tests. It ensures a consistent test environment across
 * all E2E test runs.
 *
 * Usage:
 * - Import this file in your E2E test files
 * - Call `seedTestData()` in a `beforeAll` or `beforeEach` hook
 * - Call `cleanupTestData()` in an `afterAll` or `afterEach` hook
 */

import type { DriftEvent } from '../src/app/page';

/**
 * Mock drift events for testing
 * These represent a variety of severities, resource types, and states
 */
export const mockDriftEvents: Omit<DriftEvent, 'id'>[] = [
  {
    account_id: 'test-account-123',
    resource_id: 'sg-critical-test-001',
    resource_type: 'SecurityGroup',
    change_type: 'MODIFIED',
    severity: 'CRITICAL',
    detected_at: new Date().toISOString(),
    acknowledged: false,
    changes: {
      IpPermissions: [
        {
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
      ],
    },
    snapshot: JSON.stringify({
      GroupId: 'sg-critical-test-001',
      GroupName: 'test-security-group',
    }),
    region: 'us-east-1',
    detected_by: 'config-drift-detector-test-detect',
    detection_run_id: 'test-run-critical-001',
    snapshot_key: '2026-02-21/test-snapshot-001.json',
  },
  {
    account_id: 'test-account-123',
    resource_id: 'i-high-test-002',
    resource_type: 'EC2',
    change_type: 'MODIFIED',
    severity: 'HIGH',
    detected_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    acknowledged: false,
    changes: {
      State: { Name: 'stopped' },
    },
    snapshot: JSON.stringify({
      InstanceId: 'i-high-test-002',
      InstanceType: 't3.medium',
    }),
    region: 'us-west-2',
    detected_by: 'config-drift-detector-test-detect',
    detection_run_id: 'test-run-high-002',
    snapshot_key: '2026-02-21/test-snapshot-002.json',
  },
  {
    account_id: 'test-account-123',
    resource_id: 'i-medium-test-003',
    resource_type: 'EC2',
    change_type: 'ADDED',
    severity: 'MEDIUM',
    detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    acknowledged: true,
    acknowledged_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    changes: {},
    snapshot: JSON.stringify({
      InstanceId: 'i-medium-test-003',
      InstanceType: 't2.micro',
    }),
    region: 'us-east-1',
    detected_by: 'config-drift-detector-test-detect',
    detection_run_id: 'test-run-medium-003',
    snapshot_key: '2026-02-21/test-snapshot-003.json',
  },
  {
    account_id: 'test-account-123',
    resource_id: 's3-low-test-004',
    resource_type: 'S3',
    change_type: 'MODIFIED',
    severity: 'LOW',
    detected_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    acknowledged: false,
    changes: {
      Tags: [{ Key: 'Environment', Value: 'test' }],
    },
    snapshot: JSON.stringify({
      BucketName: 's3-low-test-004',
    }),
    region: 'ap-south-1',
    detected_by: 'config-drift-detector-test-detect',
    detection_run_id: 'test-run-low-004',
    snapshot_key: '2026-02-21/test-snapshot-004.json',
  },
  {
    account_id: 'test-account-123',
    resource_id: 'i-removed-test-005',
    resource_type: 'EC2',
    change_type: 'REMOVED',
    severity: 'HIGH',
    detected_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    acknowledged: false,
    changes: {},
    snapshot: JSON.stringify({
      InstanceId: 'i-removed-test-005',
      State: { Name: 'terminated' },
    }),
    region: 'us-east-2',
    detected_by: 'config-drift-detector-test-detect',
    detection_run_id: 'test-run-removed-005',
    snapshot_key: '2026-02-21/test-snapshot-005.json',
  },
];

/**
 * Seed the test database with mock drift events
 *
 * This function should be called before running E2E tests to populate
 * the database with consistent test data.
 *
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * import { test } from '@playwright/test';
 * import { seedTestData, cleanupTestData } from './setup';
 *
 * test.beforeAll(async () => {
 *   await seedTestData();
 * });
 *
 * test.afterAll(async () => {
 *   await cleanupTestData();
 * });
 * ```
 */
export async function seedTestData(): Promise<void> {
  // TODO: Implement database seeding using Supabase client
  // This would typically involve:
  // 1. Import the Supabase client
  // 2. Insert mockDriftEvents into the drift_events table
  // 3. Handle any errors
  //
  // Example:
  // const { supabase } = await import('../src/lib/supabase-client');
  // const { error } = await supabase.from('drift_events').insert(mockDriftEvents);
  // if (error) throw new Error(`Failed to seed test data: ${error.message}`);

  console.log('Test data seeding would happen here');
  console.log(`Would seed ${mockDriftEvents.length} mock drift events`);
}

/**
 * Clean up test data from the database
 *
 * This function should be called after running E2E tests to remove
 * test data and leave the database in a clean state.
 *
 * @returns Promise<void>
 */
export async function cleanupTestData(): Promise<void> {
  // TODO: Implement database cleanup using Supabase client
  // This would typically involve:
  // 1. Import the Supabase client
  // 2. Delete all test drift events (those with test-account-123)
  // 3. Handle any errors
  //
  // Example:
  // const { supabase } = await import('../src/lib/supabase-client');
  // const { error } = await supabase
  //   .from('drift_events')
  //   .delete()
  //   .eq('account_id', 'test-account-123');
  // if (error) throw new Error(`Failed to cleanup test data: ${error.message}`);

  console.log('Test data cleanup would happen here');
}

/**
 * Mock baseline for testing
 * Used for testing baseline management features
 */
export const mockBaseline = {
  snapshot: {
    ec2: [
      {
        InstanceId: 'i-baseline-001',
        InstanceType: 't3.medium',
        State: { Name: 'running' },
      },
    ],
    securityGroups: [
      {
        GroupId: 'sg-baseline-001',
        GroupName: 'baseline-sg',
        IpPermissions: [],
      },
    ],
  },
  created_at: new Date().toISOString(),
  created_by: 'test-user',
  is_current: true,
};

/**
 * Helper function to wait for database operations to complete
 * Useful for ensuring data is available before tests run
 */
export async function waitForDatabase(timeoutMs: number = 5000): Promise<void> {
  // TODO: Implement database health check
  // This could ping Supabase to ensure it's ready
  await new Promise((resolve) => setTimeout(resolve, 100));
}
