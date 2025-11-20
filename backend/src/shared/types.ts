import { z } from 'zod';

// Enums
export enum ResourceType {
  EC2 = 'EC2',
  SecurityGroup = 'SecurityGroup',
  RDS = 'RDS',
  S3 = 'S3',
  IAM = 'IAM',
  Lambda = 'Lambda',
  CloudTrail = 'CloudTrail',
}

export enum ChangeType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  MODIFIED = 'MODIFIED',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Zod Schemas
export const ResourceTypeSchema = z.nativeEnum(ResourceType);
export const ChangeTypeSchema = z.nativeEnum(ChangeType);
export const SeveritySchema = z.nativeEnum(Severity);

// Core Types
export interface AwsResource {
  id: string;
  type: ResourceType;
  name?: string;
  state: Record<string, any>;
  tags?: Record<string, string>;
  region: string;
  accountId: string;
}

export const AwsResourceSchema = z.object({
  id: z.string(),
  type: ResourceTypeSchema,
  name: z.string().optional(),
  state: z.record(z.any()),
  tags: z.record(z.string()).optional(),
  region: z.string(),
  accountId: z.string(),
});

export interface AwsSnapshot {
  accountId: string;
  region: string;
  timestamp: string;
  resources: AwsResource[];
}

export const AwsSnapshotSchema = z.object({
  accountId: z.string(),
  region: z.string(),
  timestamp: z.string(),
  resources: z.array(AwsResourceSchema),
});

export interface DriftEvent {
  id?: string;
  accountId: string;
  resourceId: string;
  resourceType: ResourceType;
  changeType: ChangeType;
  severity: Severity;
  detectedAt: string;
  acknowledged: boolean;
  previousState?: Record<string, any>;
  currentState?: Record<string, any>;
  // Audit trail metadata
  detectedBy?: string; // Lambda function name or user identifier
  detectionRunId?: string; // Unique ID for this detection run
  snapshotKey?: string; // S3 key of the snapshot that detected this drift
}

export const DriftEventSchema = z.object({
  id: z.string().optional(),
  accountId: z.string(),
  resourceId: z.string(),
  resourceType: ResourceTypeSchema,
  changeType: ChangeTypeSchema,
  severity: SeveritySchema,
  detectedAt: z.string(),
  acknowledged: z.boolean(),
  previousState: z.record(z.any()).optional(),
  currentState: z.record(z.any()).optional(),
  // Audit trail metadata
  detectedBy: z.string().optional(),
  detectionRunId: z.string().optional(),
  snapshotKey: z.string().optional(),
});

export interface SlackAlert {
  severity: Severity;
  resourceId: string;
  resourceType: ResourceType;
  changeType: ChangeType;
  detectedAt: string;
  message?: string;
}

export const SlackAlertSchema = z.object({
  severity: SeveritySchema,
  resourceId: z.string(),
  resourceType: ResourceTypeSchema,
  changeType: ChangeTypeSchema,
  detectedAt: z.string(),
  message: z.string().optional(),
});

// Lambda Result Types
export interface SnapshotResult {
  success: boolean;
  snapshotKey?: string;
  resourceCount: number;
  timestamp: string;
  error?: string;
}

export interface DetectionResult {
  success: boolean;
  driftCount: number;
  drifts: DriftEvent[];
  baselineExists: boolean;
  timestamp: string;
  error?: string;
}

export interface AlertResult {
  success: boolean;
  alertsSent: number;
  timestamp: string;
  error?: string;
}
