import { createLogger } from './logger.js';
import {
  AwsSnapshot,
  AwsResource,
  DriftEvent,
  ChangeType,
  Severity,
  ResourceType,
} from './types.js';

const logger = createLogger('utils');

export function computeDiff(
  baseline: AwsSnapshot,
  latest: AwsSnapshot
): DriftEvent[] {
  logger.info('Computing drift between baseline and latest snapshot');

  const drifts: DriftEvent[] = [];
  const baselineMap = new Map<string, AwsResource>();
  const latestMap = new Map<string, AwsResource>();

  // Build maps for efficient lookup
  for (const resource of baseline.resources) {
    baselineMap.set(resource.id, resource);
  }

  for (const resource of latest.resources) {
    latestMap.set(resource.id, resource);
  }

  // Detect ADDED resources
  for (const resource of latest.resources) {
    if (!baselineMap.has(resource.id)) {
      const drift: DriftEvent = {
        accountId: latest.accountId,
        resourceId: resource.id,
        resourceType: resource.type,
        changeType: ChangeType.ADDED,
        severity: Severity.MEDIUM, // Will be computed later
        detectedAt: latest.timestamp,
        acknowledged: false,
        currentState: resource.state,
      };

      drift.severity = computeSeverity(drift, null, resource);
      drifts.push(drift);
    }
  }

  // Detect REMOVED resources
  for (const resource of baseline.resources) {
    if (!latestMap.has(resource.id)) {
      const drift: DriftEvent = {
        accountId: latest.accountId,
        resourceId: resource.id,
        resourceType: resource.type,
        changeType: ChangeType.REMOVED,
        severity: Severity.MEDIUM, // Will be computed later
        detectedAt: latest.timestamp,
        acknowledged: false,
        previousState: resource.state,
      };

      drift.severity = computeSeverity(drift, resource, null);
      drifts.push(drift);
    }
  }

  // Detect MODIFIED resources
  for (const resource of latest.resources) {
    const baselineResource = baselineMap.get(resource.id);

    if (baselineResource) {
      const isModified = !areStatesEqual(baselineResource.state, resource.state);
      const tagsModified = !areTagsEqual(baselineResource.tags, resource.tags);

      if (isModified || tagsModified) {
        const drift: DriftEvent = {
          accountId: latest.accountId,
          resourceId: resource.id,
          resourceType: resource.type,
          changeType: ChangeType.MODIFIED,
          severity: Severity.MEDIUM, // Will be computed later
          detectedAt: latest.timestamp,
          acknowledged: false,
          previousState: baselineResource.state,
          currentState: resource.state,
        };

        drift.severity = computeSeverity(
          drift,
          baselineResource,
          resource,
          tagsModified && !isModified
        );
        drifts.push(drift);
      }
    }
  }

  logger.info({ driftCount: drifts.length }, 'Drift computation complete');
  return drifts;
}

export function computeSeverity(
  drift: DriftEvent,
  previousResource: AwsResource | null,
  currentResource: AwsResource | null,
  onlyTagsChanged: boolean = false
): Severity {
  // Tag-only changes are LOW severity
  if (onlyTagsChanged) {
    return Severity.LOW;
  }

  // Security Group changes are CRITICAL
  if (drift.resourceType === ResourceType.SecurityGroup) {
    if (drift.changeType === ChangeType.MODIFIED) {
      return Severity.CRITICAL;
    }
    if (drift.changeType === ChangeType.REMOVED) {
      return Severity.HIGH;
    }
    return Severity.MEDIUM;
  }

  // EC2 state changes
  if (drift.resourceType === ResourceType.EC2 && drift.changeType === ChangeType.MODIFIED) {
    const previousState = previousResource?.state?.state;
    const currentState = currentResource?.state?.state;

    // State changes (running -> stopped/terminated) are HIGH severity
    if (previousState && currentState && previousState !== currentState) {
      if (
        (previousState === 'running' && (currentState === 'stopped' || currentState === 'terminated')) ||
        (currentState === 'running' && (previousState === 'stopped' || previousState === 'terminated'))
      ) {
        return Severity.HIGH;
      }
    }
  }

  // EC2 removal is HIGH severity
  if (drift.resourceType === ResourceType.EC2 && drift.changeType === ChangeType.REMOVED) {
    return Severity.HIGH;
  }

  // Default severity
  return Severity.MEDIUM;
}

function areStatesEqual(state1: Record<string, any>, state2: Record<string, any>): boolean {
  return JSON.stringify(sortObject(state1)) === JSON.stringify(sortObject(state2));
}

function areTagsEqual(
  tags1: Record<string, string> | undefined,
  tags2: Record<string, string> | undefined
): boolean {
  const t1 = tags1 || {};
  const t2 = tags2 || {};

  return JSON.stringify(sortObject(t1)) === JSON.stringify(sortObject(t2));
}

function sortObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }

  const sortedObj: any = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sortedObj[key] = sortObject(obj[key]);
  }

  return sortedObj;
}

export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}
