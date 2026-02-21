import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriftTable } from '@/components/drift-table';
import { supabase } from '@/lib/supabase-client';
import type { DriftEvent } from '@/hooks/useDrifts';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}));

// Mock logger to prevent console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('DriftTable', () => {
  const mockDrifts: DriftEvent[] = [
    {
      id: 'drift-1',
      account_id: 'account-123',
      resource_id: 'i-1234567890abcdef0',
      resource_type: 'EC2',
      change_type: 'MODIFIED',
      severity: 'HIGH',
      detected_at: '2026-02-15T10:30:00Z',
      acknowledged: false,
      changes: { State: { Name: 'running' } },
      snapshot: '{}',
      region: 'us-east-1',
      detected_by: 'config-drift-detector-prod-detect',
      detection_run_id: 'run-abc123xyz789def456ghi012jkl345',
      snapshot_key: '2026-02-15/snapshot-10-30.json',
    },
    {
      id: 'drift-2',
      account_id: 'account-123',
      resource_id: 'sg-0987654321fedcba0',
      resource_type: 'SecurityGroup',
      change_type: 'ADDED',
      severity: 'CRITICAL',
      detected_at: '2026-02-16T14:45:00Z',
      acknowledged: true,
      acknowledged_at: '2026-02-16T15:00:00Z',
      changes: { IpPermissions: [{ FromPort: 22, ToPort: 22 }] },
      snapshot: '{}',
      region: 'us-west-2',
      detected_by: 'config-drift-detector-prod-detect',
      detection_run_id: 'run-xyz789abc123def456ghi012jkl345',
      snapshot_key: '2026-02-16/snapshot-14-45.json',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drift events correctly', () => {
    render(<DriftTable drifts={mockDrifts} />);

    // Check if table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Check if resource IDs are displayed
    expect(screen.getByText('i-1234567890abcdef0')).toBeInTheDocument();
    expect(screen.getByText('sg-0987654321fedcba0')).toBeInTheDocument();

    // Check if resource types are displayed
    expect(screen.getByText('EC2')).toBeInTheDocument();
    expect(screen.getByText('SecurityGroup')).toBeInTheDocument();

    // Check if change types are displayed
    expect(screen.getByText('MODIFIED')).toBeInTheDocument();
    expect(screen.getByText('ADDED')).toBeInTheDocument();

    // Check if severity badges are displayed
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();

    // Check if status badges are displayed
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
  });

  it('shows empty state when no drifts', () => {
    render(<DriftTable drifts={[]} />);

    // Check if empty state message is displayed
    expect(screen.getByText('No drift events found')).toBeInTheDocument();

    // Table should not be rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('calls onDriftAcknowledged when button clicked', async () => {
    const user = userEvent.setup();
    const mockCallback = vi.fn();

    // Mock successful Supabase update
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    }));
    const mockFrom = vi.fn(() => ({
      update: mockUpdate,
    }));
    (supabase.from as any) = mockFrom;

    render(
      <DriftTable drifts={[mockDrifts[0]]} onDriftAcknowledged={mockCallback} />
    );

    // Find and click the acknowledge button (only visible for unacknowledged drifts)
    const acknowledgeButton = screen.getByRole('button', {
      name: /acknowledge ec2 drift for i-1234567890abcdef0/i,
    });
    expect(acknowledgeButton).toBeInTheDocument();

    await user.click(acknowledgeButton);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith('drift-1');
    });

    // Verify Supabase was called correctly
    expect(mockFrom).toHaveBeenCalledWith('drift_events');
    expect(mockUpdate).toHaveBeenCalledWith({ acknowledged: true });
  });

  it('disables button for acknowledged drifts', () => {
    render(<DriftTable drifts={[mockDrifts[1]]} />);

    // Acknowledged drift should not have an acknowledge button
    const acknowledgeButton = screen.queryByRole('button', {
      name: /acknowledge/i,
    });
    expect(acknowledgeButton).not.toBeInTheDocument();

    // Should show "Acknowledged" status badge instead
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
  });

  it('shows loading state while acknowledging', async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    // Mock Supabase with delayed response
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => updatePromise),
    }));
    const mockFrom = vi.fn(() => ({
      update: mockUpdate,
    }));
    (supabase.from as any) = mockFrom;

    render(<DriftTable drifts={[mockDrifts[0]]} />);

    const acknowledgeButton = screen.getByRole('button', {
      name: /acknowledge ec2 drift for i-1234567890abcdef0/i,
    });

    // Click the button
    await user.click(acknowledgeButton);

    // Button should be disabled and show loading state
    await waitFor(() => {
      expect(acknowledgeButton).toBeDisabled();
    });
    expect(screen.getByText('Acknowledging...')).toBeInTheDocument();

    // Button should have aria-busy attribute
    expect(acknowledgeButton).toHaveAttribute('aria-busy', 'true');

    // Loading spinner should be present (aria-hidden SVG)
    const spinner = acknowledgeButton.querySelector('svg[aria-hidden="true"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');

    // Resolve the promise to complete the operation
    resolveUpdate!({ data: null, error: null });

    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText('Acknowledging...')).not.toBeInTheDocument();
    });
  });

  it('displays audit trail metadata when present', () => {
    render(<DriftTable drifts={mockDrifts} />);

    // Check if detected_by is displayed
    expect(screen.getAllByText('By:').length).toBe(2);
    expect(
      screen.getAllByText('config-drift-detector-prod-detect').length
    ).toBe(2);

    // Check if detection_run_id labels are displayed
    expect(screen.getAllByText('Run:').length).toBe(2);

    // Check if snapshot_key is displayed
    expect(screen.getAllByText('Snapshot:').length).toBe(2);
    expect(screen.getByText('2026-02-15/snapshot-10-30.json')).toBeInTheDocument();
    expect(screen.getByText('2026-02-16/snapshot-14-45.json')).toBeInTheDocument();

    // Verify full detection_run_id is in title attribute for tooltip (this is the key test)
    const runIdElements = screen.getAllByTitle(mockDrifts[0].detection_run_id!);
    expect(runIdElements.length).toBeGreaterThan(0);
    expect(runIdElements[0]).toHaveTextContent('run-abc123xyz789def4');

    // Also check the second drift's run ID
    const runId2Elements = screen.getAllByTitle(mockDrifts[1].detection_run_id!);
    expect(runId2Elements.length).toBeGreaterThan(0);
    expect(runId2Elements[0]).toHaveTextContent('run-xyz789abc123def4');
  });

  it('shows "No audit data" when audit trail metadata is missing', () => {
    const driftWithoutAudit: DriftEvent = {
      id: 'drift-3',
      account_id: 'account-123',
      resource_id: 'i-old-instance',
      resource_type: 'EC2',
      change_type: 'REMOVED',
      severity: 'MEDIUM',
      detected_at: '2026-02-10T08:00:00Z',
      acknowledged: false,
      snapshot: '{}',
    };

    render(<DriftTable drifts={[driftWithoutAudit]} />);

    // Should show "No audit data" message
    expect(screen.getByText('No audit data')).toBeInTheDocument();
  });
});
