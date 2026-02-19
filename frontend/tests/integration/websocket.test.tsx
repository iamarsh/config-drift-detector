import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '@/app/page';
import type { DriftEvent } from '@/app/page';

// Mock Supabase client with WebSocket channel mock
vi.mock('@/lib/supabase-client', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    },
    mockChannel,
  };
});

// Mock logger to prevent console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('WebSocket Integration Tests', () => {
  let queryClient: QueryClient;
  let mockChannel: any;
  let mockRemoveChannel: any;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Get mocked supabase instance
    const { supabase } = await import('@/lib/supabase-client');
    const channelMock = supabase.channel as any;
    mockChannel = channelMock();
    mockRemoveChannel = supabase.removeChannel;

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('subscribes to drift_events changes on mount', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    // Wait for component to mount and setup subscriptions
    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    });

    // Verify subscription was created with correct channel name
    const { supabase } = await import('@/lib/supabase-client');
    expect(supabase.channel).toHaveBeenCalledWith('drift_events_changes_dashboard');

    // Verify INSERT event handler was registered
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'drift_events',
      }),
      expect.any(Function)
    );

    // Verify UPDATE event handler was registered
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'drift_events',
      }),
      expect.any(Function)
    );

    // Verify subscription was activated
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('adds new drift to cache when INSERT event received', async () => {
    const mockDrift: DriftEvent = {
      id: 'test-drift-1',
      account_id: 'account-123',
      resource_id: 'i-test123',
      resource_type: 'EC2',
      change_type: 'MODIFIED',
      severity: 'MEDIUM',
      detected_at: '2026-02-21T10:00:00Z',
      acknowledged: false,
      changes: { State: { Name: 'running' } },
      snapshot: '{}',
      region: 'us-east-1',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    });

    // Get the INSERT handler function
    const insertHandler = mockChannel.on.mock.calls.find(
      (call) => call[1]?.event === 'INSERT'
    )?.[2];

    expect(insertHandler).toBeDefined();

    // Simulate INSERT event from WebSocket
    if (insertHandler) {
      insertHandler({
        new: mockDrift,
        old: null,
        eventType: 'INSERT',
      });
    }

    // Verify the drift was added to the React Query cache
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['drifts', { limit: 20 }]) as
        | DriftEvent[]
        | undefined;

      expect(cachedData).toBeDefined();
      expect(cachedData?.some((d) => d.id === mockDrift.id)).toBe(true);
    });
  });

  it('shows toast notification for HIGH/CRITICAL severity drifts', async () => {
    const criticalDrift: DriftEvent = {
      id: 'critical-drift-1',
      account_id: 'account-456',
      resource_id: 'sg-critical123',
      resource_type: 'SecurityGroup',
      change_type: 'MODIFIED',
      severity: 'CRITICAL',
      detected_at: '2026-02-21T11:00:00Z',
      acknowledged: false,
      changes: { IpPermissions: [{ FromPort: 22 }] },
      snapshot: '{}',
      region: 'us-west-2',
    };

    const highDrift: DriftEvent = {
      id: 'high-drift-1',
      account_id: 'account-789',
      resource_id: 'i-high123',
      resource_type: 'EC2',
      change_type: 'REMOVED',
      severity: 'HIGH',
      detected_at: '2026-02-21T11:15:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'us-east-1',
    };

    const mediumDrift: DriftEvent = {
      id: 'medium-drift-1',
      account_id: 'account-999',
      resource_id: 's3-medium123',
      resource_type: 'S3',
      change_type: 'ADDED',
      severity: 'MEDIUM',
      detected_at: '2026-02-21T11:30:00Z',
      acknowledged: false,
      changes: {},
      snapshot: '{}',
      region: 'ap-south-1',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    });

    // Get the INSERT handler
    const insertHandler = mockChannel.on.mock.calls.find(
      (call) => call[1]?.event === 'INSERT'
    )?.[2];

    expect(insertHandler).toBeDefined();

    // Simulate CRITICAL drift INSERT
    if (insertHandler) {
      insertHandler({
        new: criticalDrift,
        old: null,
        eventType: 'INSERT',
      });
    }

    // Toast should be visible for CRITICAL drift
    await waitFor(() => {
      expect(screen.getByText('CRITICAL Drift Detected!')).toBeInTheDocument();
      expect(
        screen.getByText('SecurityGroup: sg-critical123 (MODIFIED)')
      ).toBeInTheDocument();
    });

    // Simulate HIGH drift INSERT
    if (insertHandler) {
      insertHandler({
        new: highDrift,
        old: null,
        eventType: 'INSERT',
      });
    }

    // Toast should be visible for HIGH drift
    await waitFor(() => {
      expect(screen.getByText('HIGH Drift Detected!')).toBeInTheDocument();
      expect(screen.getByText('EC2: i-high123 (REMOVED)')).toBeInTheDocument();
    });

    // Simulate MEDIUM drift INSERT
    if (insertHandler) {
      insertHandler({
        new: mediumDrift,
        old: null,
        eventType: 'INSERT',
      });
    }

    // No toast should be shown for MEDIUM drift
    await waitFor(() => {
      expect(screen.queryByText('MEDIUM Drift Detected!')).not.toBeInTheDocument();
    });
  });

  it('cleans up WebSocket subscription on unmount', async () => {
    const { unmount, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // Verify cleanup was called
    await waitFor(() => {
      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });
});
