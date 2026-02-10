import { vi } from 'vitest';

// Mock drift events data
export const mockDriftEvents = [
  {
    id: 'test-drift-1',
    resource_id: 'i-12345',
    resource_type: 'EC2',
    change_type: 'MODIFIED',
    severity: 'HIGH',
    detected_at: '2026-02-01T12:00:00Z',
    acknowledged: false,
    changes: { instanceType: 't2.micro → t2.small' },
    detected_by: 'detect-lambda',
    detection_run_id: 'detect-123456',
    snapshot_key: '2026-02-01/12-00-00.json',
  },
  {
    id: 'test-drift-2',
    resource_id: 'sg-67890',
    resource_type: 'SecurityGroup',
    change_type: 'ADDED',
    severity: 'CRITICAL',
    detected_at: '2026-02-01T12:05:00Z',
    acknowledged: false,
    changes: { rule: 'Added 0.0.0.0/0:22' },
  },
];

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockResolvedValue({ data: mockDriftEvents, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockDriftEvents[0], error: null }),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  })),
};

// Mock Supabase module
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabaseClient,
}));
