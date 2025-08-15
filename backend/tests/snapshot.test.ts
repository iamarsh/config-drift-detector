import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { handler } from '../src/lambdas/snapshot';

// Mock S3, EC2, and RDS clients
const s3Mock = mockClient(S3Client);
const ec2Mock = mockClient(EC2Client);
const rdsMock = mockClient(RDSClient);

describe('Snapshot Lambda Handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    s3Mock.reset();
    ec2Mock.reset();
    rdsMock.reset();

    // Set required environment variables
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_ACCOUNT_ID = '123456789';
    process.env.S3_BUCKET_NAME = 'test-bucket';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully capture snapshot and upload to S3', async () => {
    // Mock EC2 API responses
    ec2Mock.on(DescribeInstancesCommand).resolves({
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-123',
              InstanceType: 't2.micro',
              State: { Name: 'running' },
              Tags: [{ Key: 'Name', Value: 'test-instance' }],
            },
          ],
        },
      ],
    });

    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-123',
          GroupName: 'default',
          Description: 'Default security group',
          IpPermissions: [],
          IpPermissionsEgress: [],
        },
      ],
    });

    // Mock RDS API responses
    rdsMock.on(DescribeDBInstancesCommand).resolves({
      DBInstances: [],
    });

    // Mock S3 API responses
    s3Mock.on(ListBucketsCommand).resolves({
      Buckets: [],
    });

    // Mock S3 upload
    s3Mock.on(PutObjectCommand).resolves({});

    // Execute handler
    const result = await handler({});

    // Assertions
    expect(result.success).toBe(true);
    expect(result.resourceCount).toBeGreaterThan(0);
    expect(result.snapshotKey).toBeDefined();
    expect(result.snapshotKey).toMatch(/\d{4}-\d{2}-\d{2}\/\d{2}-\d{2}-\d{2}\.json/);

    // Verify S3 was called (ListBuckets + PutObject)
    expect(s3Mock.calls().length).toBeGreaterThanOrEqual(1);

    // Find the PutObject call
    const putObjectCall = s3Mock.calls().find(call => call.args[0].constructor.name === 'PutObjectCommand');
    expect(putObjectCall).toBeDefined();
    expect(putObjectCall?.args[0].input).toMatchObject({
      Bucket: 'test-bucket',
      ContentType: 'application/json',
    });
  });

  it('should handle S3 upload failure gracefully', async () => {
    // Mock EC2 to return empty results
    ec2Mock.on(DescribeInstancesCommand).resolves({ Reservations: [] });
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({ SecurityGroups: [] });

    // Mock RDS to return empty results
    rdsMock.on(DescribeDBInstancesCommand).resolves({ DBInstances: [] });

    // Mock S3 ListBuckets
    s3Mock.on(ListBucketsCommand).resolves({ Buckets: [] });

    // Mock S3 to throw error on upload
    s3Mock.on(PutObjectCommand).rejects(new Error('S3 upload failed'));

    // Execute handler
    const result = await handler({});

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('S3 upload failed');
    expect(result.resourceCount).toBe(0);
  });

  it('should fail when S3_BUCKET_NAME is not set', async () => {
    // Remove required environment variable
    delete process.env.S3_BUCKET_NAME;

    // Execute handler
    const result = await handler({});

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('S3_BUCKET_NAME environment variable is required');
  });
});
