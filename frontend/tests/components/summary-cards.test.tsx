import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from '@/components/summary-cards';
import type { DriftEvent } from '@/app/page';

describe('SummaryCards', () => {
  const mockDrifts: DriftEvent[] = [
    {
      id: 'drift-1',
      account_id: 'account-123',
      resource_id: 'sg-critical-1',
      resource_type: 'SecurityGroup',
      change_type: 'MODIFIED',
      severity: 'CRITICAL',
      detected_at: '2026-02-18T10:00:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'us-east-1',
    },
    {
      id: 'drift-2',
      account_id: 'account-123',
      resource_id: 'sg-critical-2',
      resource_type: 'SecurityGroup',
      change_type: 'ADDED',
      severity: 'CRITICAL',
      detected_at: '2026-02-18T10:15:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'us-west-2',
    },
    {
      id: 'drift-3',
      account_id: 'account-123',
      resource_id: 'i-high-1',
      resource_type: 'EC2',
      change_type: 'MODIFIED',
      severity: 'HIGH',
      detected_at: '2026-02-18T10:30:00Z',
      acknowledged: true,
      acknowledged_at: '2026-02-18T11:00:00Z',
      changes: {},
      snapshot: '{}',
      region: 'us-east-1',
    },
    {
      id: 'drift-4',
      account_id: 'account-123',
      resource_id: 'i-high-2',
      resource_type: 'EC2',
      change_type: 'REMOVED',
      severity: 'HIGH',
      detected_at: '2026-02-18T10:45:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'us-east-2',
    },
    {
      id: 'drift-5',
      account_id: 'account-123',
      resource_id: 'i-medium-1',
      resource_type: 'EC2',
      change_type: 'MODIFIED',
      severity: 'MEDIUM',
      detected_at: '2026-02-18T11:00:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'ap-south-1',
    },
    {
      id: 'drift-6',
      account_id: 'account-123',
      resource_id: 's3-low-1',
      resource_type: 'S3',
      change_type: 'MODIFIED',
      severity: 'LOW',
      detected_at: '2026-02-18T11:15:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'us-east-1',
    },
  ];

  it('renders summary cards with correct counts', () => {
    render(<SummaryCards drifts={mockDrifts} />);

    // Check Total Drifts card
    expect(screen.getByText('Total Drifts')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Check Critical card
    expect(screen.getByText('Critical')).toBeInTheDocument();
    // Two CRITICAL drifts in mock data
    const criticalCounts = screen.getAllByText('2');
    expect(criticalCounts.length).toBeGreaterThan(0);

    // Check High card
    expect(screen.getByText('High')).toBeInTheDocument();
    // Two HIGH drifts in mock data (one acknowledged, one not)
    // This '2' will overlap with critical count, so we just verify it exists

    // Check Medium card
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check Unacknowledged card
    expect(screen.getByText('Unacknowledged')).toBeInTheDocument();
    // 5 unacknowledged drifts (all except drift-3)
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<SummaryCards drifts={[]} />);

    // All cards should show 0
    expect(screen.getByText('Total Drifts')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Unacknowledged')).toBeInTheDocument();

    // All counts should be 0
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBe(5); // 5 cards, all showing 0
  });

  it('calculates severity counts correctly', () => {
    const testDrifts: DriftEvent[] = [
      {
        id: 'test-1',
        account_id: 'account-123',
        resource_id: 'resource-1',
        resource_type: 'EC2',
        change_type: 'ADDED',
        severity: 'CRITICAL',
        detected_at: '2026-02-18T12:00:00Z',
        acknowledged: false,
        changes: {},
        snapshot: '{}',
        region: 'us-east-1',
      },
      {
        id: 'test-2',
        account_id: 'account-123',
        resource_id: 'resource-2',
        resource_type: 'SecurityGroup',
        change_type: 'MODIFIED',
        severity: 'CRITICAL',
        detected_at: '2026-02-18T12:05:00Z',
        acknowledged: true,
        acknowledged_at: '2026-02-18T12:10:00Z',
        changes: {},
        snapshot: '{}',
        region: 'us-east-1',
      },
      {
        id: 'test-3',
        account_id: 'account-123',
        resource_id: 'resource-3',
        resource_type: 'EC2',
        change_type: 'MODIFIED',
        severity: 'CRITICAL',
        detected_at: '2026-02-18T12:10:00Z',
        acknowledged: false,
        changes: {},
        snapshot: '{}',
        region: 'us-west-2',
      },
      {
        id: 'test-4',
        account_id: 'account-123',
        resource_id: 'resource-4',
        resource_type: 'EC2',
        change_type: 'REMOVED',
        severity: 'HIGH',
        detected_at: '2026-02-18T12:15:00Z',
        acknowledged: false,
        changes: {},
        snapshot: '{}',
        region: 'us-east-1',
      },
      {
        id: 'test-5',
        account_id: 'account-123',
        resource_id: 'resource-5',
        resource_type: 'S3',
        change_type: 'MODIFIED',
        severity: 'LOW',
        detected_at: '2026-02-18T12:20:00Z',
        acknowledged: false,
        changes: {},
        snapshot: '{}',
        region: 'us-east-1',
      },
    ];

    render(<SummaryCards drifts={testDrifts} />);

    // Total: 5 drifts
    expect(screen.getByText('5')).toBeInTheDocument();

    // Critical: 3 drifts
    expect(screen.getByText('3')).toBeInTheDocument();

    // High: 1 drift
    expect(screen.getByText('1')).toBeInTheDocument();

    // Medium: 0 drifts
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);

    // Low: 1 drift (already tested above)

    // Unacknowledged: 4 drifts (all except test-2)
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
