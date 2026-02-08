import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseClient } from '../src/shared/supabase-client';
import { DriftEvent } from '../src/shared/types';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('SupabaseClient - Batch Insertion', () => {
  let supabaseClient: SupabaseClient;

  beforeEach(() => {
    // Set required environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    supabaseClient = new SupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('insertDriftEventsBatch', () => {
    it('should insert small batch of drift events (< 100)', async () => {
      const mockEvents: DriftEvent[] = Array.from({ length: 50 }, (_, i) => ({
        id: `drift-${i}`,
        accountId: '123456789',
        resourceId: `i-${i}`,
        resourceType: 'EC2' as const,
        changeType: 'MODIFIED',
        severity: 'MEDIUM' as const,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        previousState: { state: 'running' },
        currentState: { state: 'stopped' },
        detectedBy: 'test-lambda',
        detectionRunId: 'test-run-001',
      }));

      // Mock the insert method to return IDs
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockEvents.map((e) => ({ id: e.id })),
          error: null,
        }),
      });

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseClient.insertDriftEventsBatch(mockEvents);

      expect(result).toHaveLength(50);
      expect(mockInsert).toHaveBeenCalledTimes(1); // Single batch
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            account_id: '123456789',
            resource_id: 'i-0',
            resource_type: 'EC2',
          }),
        ])
      );
    });

    it('should split large batch into multiple batches (> 100)', async () => {
      const mockEvents: DriftEvent[] = Array.from({ length: 250 }, (_, i) => ({
        id: `drift-${i}`,
        accountId: '123456789',
        resourceId: `i-${i}`,
        resourceType: 'EC2' as const,
        changeType: 'MODIFIED',
        severity: 'MEDIUM' as const,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        previousState: { state: 'running' },
        currentState: { state: 'stopped' },
      }));

      // Mock the insert method to return IDs matching the batch size
      const mockInsert = vi.fn().mockImplementation((records) => ({
        select: vi.fn().mockResolvedValue({
          data: records.map((_: any, i: number) => ({ id: `id-${i}` })),
          error: null,
        }),
      }));

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseClient.insertDriftEventsBatch(mockEvents);

      expect(result).toHaveLength(250);
      expect(mockInsert).toHaveBeenCalledTimes(3); // 3 batches (100, 100, 50)
    });

    it('should handle exact batch size of 100', async () => {
      const mockEvents: DriftEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `drift-${i}`,
        accountId: '123456789',
        resourceId: `i-${i}`,
        resourceType: 'EC2' as const,
        changeType: 'MODIFIED',
        severity: 'MEDIUM' as const,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        previousState: {},
        currentState: {},
      }));

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockEvents.map((e) => ({ id: e.id })),
          error: null,
        }),
      });

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseClient.insertDriftEventsBatch(mockEvents);

      expect(result).toHaveLength(100);
      expect(mockInsert).toHaveBeenCalledTimes(1); // Exactly one batch
    });

    it('should handle empty array', async () => {
      const mockEvents: DriftEvent[] = [];

      const result = await supabaseClient.insertDriftEventsBatch(mockEvents);

      expect(result).toHaveLength(0);
    });

    it('should throw error when batch insertion fails', async () => {
      const mockEvents: DriftEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `drift-${i}`,
        accountId: '123456789',
        resourceId: `i-${i}`,
        resourceType: 'EC2' as const,
        changeType: 'MODIFIED',
        severity: 'MEDIUM' as const,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        previousState: {},
        currentState: {},
      }));

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'DB_ERROR' },
        }),
      });

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await expect(supabaseClient.insertDriftEventsBatch(mockEvents)).rejects.toThrow();
    });

    it('should preserve audit trail metadata in batch insertion', async () => {
      const mockEvents: DriftEvent[] = [
        {
          id: 'drift-1',
          accountId: '123456789',
          resourceId: 'i-123',
          resourceType: 'EC2' as const,
          changeType: 'MODIFIED',
          severity: 'HIGH' as const,
          detectedAt: new Date().toISOString(),
          acknowledged: false,
          previousState: { state: 'running' },
          currentState: { state: 'stopped' },
          detectedBy: 'detect-lambda',
          detectionRunId: 'run-123',
          snapshotKey: 's3://bucket/key',
        },
      ];

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'inserted-id' }],
          error: null,
        }),
      });

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await supabaseClient.insertDriftEventsBatch(mockEvents);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            detected_by: 'detect-lambda',
            detection_run_id: 'run-123',
            snapshot_key: 's3://bucket/key',
          }),
        ])
      );
    });
  });

  describe('Performance Comparison', () => {
    it('should demonstrate performance improvement over individual inserts', async () => {
      const mockEvents: DriftEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `drift-${i}`,
        accountId: '123456789',
        resourceId: `i-${i}`,
        resourceType: 'EC2' as const,
        changeType: 'MODIFIED',
        severity: 'MEDIUM' as const,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        previousState: {},
        currentState: {},
      }));

      // Mock batch insert (1 query)
      const mockBatchInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockEvents.map((e) => ({ id: e.id })),
          error: null,
        }),
      });

      (supabaseClient as any).client.from = vi.fn().mockReturnValue({
        insert: mockBatchInsert,
      });

      // Batch insertion: 1 query for 100 events
      await supabaseClient.insertDriftEventsBatch(mockEvents);
      expect(mockBatchInsert).toHaveBeenCalledTimes(1);

      // Individual insertion would require 100 queries
      // This test demonstrates the 100x improvement
    });
  });
});
