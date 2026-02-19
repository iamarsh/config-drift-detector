import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAcknowledgeDrift, type DriftEvent } from '@/hooks/useDrifts';
import { supabase } from '@/lib/supabase-client';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAcknowledgeDrift', () => {
  const mockDrift: DriftEvent = {
    id: 'drift-123',
    account_id: 'account-456',
    resource_id: 'i-1234567890abcdef0',
    resource_type: 'EC2',
    change_type: 'MODIFIED',
    severity: 'HIGH',
    detected_at: '2026-02-15T10:30:00Z',
    acknowledged: false,
  };

  const acknowledgedDrift: DriftEvent = {
    ...mockDrift,
    acknowledged: true,
    acknowledged_at: '2026-02-18T15:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acknowledges drift successfully', async () => {
    // Mock successful mutation
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: acknowledgedDrift,
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useAcknowledgeDrift(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate('drift-123');

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify mutation result
    expect(result.current.data).toEqual(acknowledgedDrift);
    expect(result.current.isError).toBe(false);

    // Verify Supabase was called correctly
    expect(supabase.from).toHaveBeenCalledWith('drift_events');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        acknowledged: true,
        acknowledged_at: expect.any(String),
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'drift-123');
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();
  });

  it('performs optimistic update and updates cache', async () => {
    // Create a QueryClient with initial data
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Pre-populate cache with unacknowledged drift
    queryClient.setQueryData(['drifts', {}], [mockDrift]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Mock successful mutation
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: acknowledgedDrift,
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useAcknowledgeDrift(), { wrapper });

    // Verify initial state
    const initialData = queryClient.getQueryData(['drifts', {}]) as DriftEvent[];
    expect(initialData[0].acknowledged).toBe(false);

    // Trigger mutation
    result.current.mutate('drift-123');

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase was called (mutation executed)
    expect(supabase.from).toHaveBeenCalledWith('drift_events');
  });

  it('handles errors correctly', async () => {
    // Mock error response
    const mockError = new Error('Network error: Failed to acknowledge drift');
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useAcknowledgeDrift(), {
      wrapper: createWrapper(),
    });

    // Trigger mutation
    result.current.mutate('drift-123');

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('invalidates queries after successful mutation', async () => {
    // Create QueryClient
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Spy on invalidateQueries
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Mock successful mutation
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: acknowledgedDrift,
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useAcknowledgeDrift(), { wrapper });

    // Trigger mutation
    result.current.mutate('drift-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify invalidateQueries was called with correct key
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['drifts'],
        })
      );
    });
  });
});
