import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDrifts, type DriftEvent } from '@/hooks/useDrifts';
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
        retry: false, // Disable retries for tests
        gcTime: 0, // Disable cache garbage collection
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDrifts', () => {
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
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches drifts successfully', async () => {
    // Mock successful Supabase query
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({ data: mockDrifts, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data
    expect(result.current.data).toEqual(mockDrifts);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify Supabase was called correctly
    expect(supabase.from).toHaveBeenCalledWith('drift_events');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('detected_at', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(500); // Default limit
  });

  it('applies severity filter correctly', async () => {
    // Mock query builder with filter
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: [mockDrifts[1]], // Only CRITICAL drift
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      eq: mockEq,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts({ severity: 'CRITICAL' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify severity filter was applied
    expect(mockEq).toHaveBeenCalledWith('severity', 'CRITICAL');
    expect(result.current.data).toEqual([mockDrifts[1]]);
  });

  it('applies type filter correctly', async () => {
    // Mock query builder with type filter
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: [mockDrifts[0]], // Only EC2 drift
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      eq: mockEq,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts({ type: 'EC2' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify type filter was applied
    expect(mockEq).toHaveBeenCalledWith('resource_type', 'EC2');
    expect(result.current.data).toEqual([mockDrifts[0]]);
  });

  it('applies acknowledged filter correctly', async () => {
    // Mock query builder with acknowledged filter
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: [mockDrifts[1]], // Only acknowledged drift
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      eq: mockEq,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts({ acknowledged: 'true' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify acknowledged filter was applied (converts 'true' string to boolean)
    expect(mockEq).toHaveBeenCalledWith('acknowledged', true);
    expect(result.current.data).toEqual([mockDrifts[1]]);
  });

  it('applies custom limit correctly', async () => {
    // Mock query builder with custom limit
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: mockDrifts.slice(0, 1), // First drift only
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts({ limit: 1 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify custom limit was applied
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('handles errors correctly', async () => {
    // Mock error response
    const mockError = new Error('Database connection failed');
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('uses query caching with correct staleTime', async () => {
    // Mock successful query
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({ data: mockDrifts, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result, rerender } = renderHook(() => useDrifts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Clear mock call count
    vi.clearAllMocks();

    // Rerender hook (should use cache, not refetch)
    rerender();

    // Should not call Supabase again (data is cached)
    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(mockDrifts);
  });

  it('supports refetch functionality', async () => {
    // Mock successful query
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({ data: mockDrifts, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDrifts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Clear mock call count
    vi.clearAllMocks();

    // Manually trigger refetch
    result.current.refetch();

    await waitFor(() => {
      // Supabase should be called again
      expect(supabase.from).toHaveBeenCalled();
    });
  });
});
