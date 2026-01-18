import { describe, it, expect } from 'vitest';
import { computeDiff, computeSeverity } from '../src/shared/utils';
import {
  AwsSnapshot,
  AwsResource,
  ResourceType,
  ChangeType,
  Severity,
  DriftEvent,
} from '../src/shared/types';

describe('computeDiff', () => {
  it('should detect ADDED resources', () => {
    const baseline: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T00:00:00Z',
      resources: [],
    };

    const latest: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T01:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'running' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const drifts = computeDiff(baseline, latest);

    expect(drifts).toHaveLength(1);
    expect(drifts[0].changeType).toBe(ChangeType.ADDED);
    expect(drifts[0].resourceId).toBe('i-123');
  });

  it('should detect REMOVED resources', () => {
    const baseline: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T00:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'running' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const latest: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T01:00:00Z',
      resources: [],
    };

    const drifts = computeDiff(baseline, latest);

    expect(drifts).toHaveLength(1);
    expect(drifts[0].changeType).toBe(ChangeType.REMOVED);
    expect(drifts[0].resourceId).toBe('i-123');
  });

  it('should detect MODIFIED resources', () => {
    const baseline: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T00:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'running' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const latest: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T01:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'stopped' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const drifts = computeDiff(baseline, latest);

    expect(drifts).toHaveLength(1);
    expect(drifts[0].changeType).toBe(ChangeType.MODIFIED);
    expect(drifts[0].resourceId).toBe('i-123');
  });

  it('should not detect drift when resources are unchanged', () => {
    const baseline: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T00:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'running' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const latest: AwsSnapshot = {
      accountId: '123456789',
      region: 'us-east-2',
      timestamp: '2024-01-01T01:00:00Z',
      resources: [
        {
          id: 'i-123',
          type: ResourceType.EC2,
          name: 'test-instance',
          state: { instanceType: 't2.micro', state: 'running' },
          region: 'us-east-2',
          accountId: '123456789',
        },
      ],
    };

    const drifts = computeDiff(baseline, latest);

    expect(drifts).toHaveLength(0);
  });
});

describe('computeSeverity', () => {
  it('should return CRITICAL for SecurityGroup MODIFIED', () => {
    const drift: DriftEvent = {
      accountId: '123456789',
      resourceId: 'sg-123',
      resourceType: ResourceType.SecurityGroup,
      changeType: ChangeType.MODIFIED,
      severity: Severity.MEDIUM,
      detectedAt: '2024-01-01T00:00:00Z',
      acknowledged: false,
    };

    const severity = computeSeverity(drift, null, null);

    expect(severity).toBe(Severity.CRITICAL);
  });

  it('should return HIGH for EC2 state change from running to stopped', () => {
    const previousResource: AwsResource = {
      id: 'i-123',
      type: ResourceType.EC2,
      state: { state: 'running' },
      region: 'us-east-2',
      accountId: '123456789',
    };

    const currentResource: AwsResource = {
      id: 'i-123',
      type: ResourceType.EC2,
      state: { state: 'stopped' },
      region: 'us-east-2',
      accountId: '123456789',
    };

    const drift: DriftEvent = {
      accountId: '123456789',
      resourceId: 'i-123',
      resourceType: ResourceType.EC2,
      changeType: ChangeType.MODIFIED,
      severity: Severity.MEDIUM,
      detectedAt: '2024-01-01T00:00:00Z',
      acknowledged: false,
    };

    const severity = computeSeverity(drift, previousResource, currentResource);

    expect(severity).toBe(Severity.HIGH);
  });

  it('should return LOW for tag-only changes', () => {
    const drift: DriftEvent = {
      accountId: '123456789',
      resourceId: 'i-123',
      resourceType: ResourceType.EC2,
      changeType: ChangeType.MODIFIED,
      severity: Severity.MEDIUM,
      detectedAt: '2024-01-01T00:00:00Z',
      acknowledged: false,
    };

    const severity = computeSeverity(drift, null, null, true);

    expect(severity).toBe(Severity.LOW);
  });

  it('should return HIGH for EC2 REMOVED', () => {
    const drift: DriftEvent = {
      accountId: '123456789',
      resourceId: 'i-123',
      resourceType: ResourceType.EC2,
      changeType: ChangeType.REMOVED,
      severity: Severity.MEDIUM,
      detectedAt: '2024-01-01T00:00:00Z',
      acknowledged: false,
    };

    const severity = computeSeverity(drift, null, null);

    expect(severity).toBe(Severity.HIGH);
  });
});
