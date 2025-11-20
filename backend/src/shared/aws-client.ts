import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  Instance,
  SecurityGroup,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  type DBInstance,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  type Bucket,
} from '@aws-sdk/client-s3';
import { createLogger } from './logger.js';
import { AwsResource, AwsSnapshot, ResourceType } from './types.js';

const logger = createLogger('aws-client');

export class AwsClient {
  private ec2Client: EC2Client;
  private rdsClient: RDSClient;
  private s3Client: S3Client;
  private region: string;
  private accountId: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-2';
    this.accountId = process.env.AWS_ACCOUNT_ID || '';

    this.ec2Client = new EC2Client({ region: this.region });
    this.rdsClient = new RDSClient({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });

    logger.info({ region: this.region, accountId: this.accountId }, 'AWS client initialized');
  }

  async snapshotEC2(): Promise<AwsResource[]> {
    try {
      logger.info('Fetching EC2 instances');

      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);

      const instances: AwsResource[] = [];

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(this.mapEC2Instance(instance));
        }
      }

      logger.info({ count: instances.length }, 'EC2 instances fetched');
      return instances;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch EC2 instances');
      throw error;
    }
  }

  async snapshotSecurityGroups(): Promise<AwsResource[]> {
    try {
      logger.info('Fetching Security Groups');

      const command = new DescribeSecurityGroupsCommand({});
      const response = await this.ec2Client.send(command);

      const securityGroups: AwsResource[] = (response.SecurityGroups || []).map(
        (sg) => this.mapSecurityGroup(sg)
      );

      logger.info({ count: securityGroups.length }, 'Security Groups fetched');
      return securityGroups;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Security Groups');
      throw error;
    }
  }

  /**
   * Capture RDS DB instance configurations
   */
  async snapshotRDS(): Promise<AwsResource[]> {
    try {
      logger.info('Fetching RDS instances');

      const command = new DescribeDBInstancesCommand({});
      const response = await this.rdsClient.send(command);

      if (!response.DBInstances || response.DBInstances.length === 0) {
        logger.info('No RDS instances found');
        return [];
      }

      const instances: AwsResource[] = response.DBInstances.map((instance: DBInstance) =>
        this.mapRDSInstance(instance)
      );

      logger.info({ count: instances.length }, 'RDS instances fetched');
      return instances;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch RDS instances');
      throw error;
    }
  }

  /**
   * Capture S3 bucket configurations
   */
  async snapshotS3(): Promise<AwsResource[]> {
    try {
      logger.info('Fetching S3 buckets');

      // List all buckets
      const listCommand = new ListBucketsCommand({});
      const listResponse = await this.s3Client.send(listCommand);

      if (!listResponse.Buckets || listResponse.Buckets.length === 0) {
        logger.info('No S3 buckets found');
        return [];
      }

      // Fetch config for each bucket in parallel
      const buckets = await Promise.all(
        listResponse.Buckets.map(async (bucket: Bucket) => {
          const bucketName = bucket.Name!;

          // Fetch bucket configurations (handle errors gracefully)
          const [versioning, encryption, lifecycle, publicAccess, tags] = await Promise.allSettled([
            this.s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName })),
            this.s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName })),
            this.s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })),
            this.s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName })),
            this.s3Client.send(new GetBucketTaggingCommand({ Bucket: bucketName })),
          ]);

          return this.mapS3Bucket(bucket, { versioning, encryption, lifecycle, publicAccess, tags });
        })
      );

      logger.info({ count: buckets.length }, 'S3 buckets fetched');
      return buckets;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch S3 buckets');
      throw error;
    }
  }

  async getAllSnapshots(): Promise<AwsSnapshot> {
    logger.info('Starting complete AWS snapshot');

    const [ec2Instances, securityGroups] = await Promise.all([
      this.snapshotEC2(),
      this.snapshotSecurityGroups(),
    ]);

    const snapshot: AwsSnapshot = {
      accountId: this.accountId,
      region: this.region,
      timestamp: new Date().toISOString(),
      resources: [...ec2Instances, ...securityGroups],
    };

    logger.info(
      { totalResources: snapshot.resources.length },
      'Complete snapshot created'
    );

    return snapshot;
  }

  private mapEC2Instance(instance: Instance): AwsResource {
    const tags: Record<string, string> = {};

    for (const tag of instance.Tags || []) {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    }

    return {
      id: instance.InstanceId || '',
      type: ResourceType.EC2,
      name: tags['Name'] || instance.InstanceId || '',
      state: {
        instanceType: instance.InstanceType,
        state: instance.State?.Name,
        privateIpAddress: instance.PrivateIpAddress,
        publicIpAddress: instance.PublicIpAddress,
        vpcId: instance.VpcId,
        subnetId: instance.SubnetId,
        securityGroups: instance.SecurityGroups?.map((sg) => ({
          id: sg.GroupId,
          name: sg.GroupName,
        })),
        launchTime: instance.LaunchTime?.toISOString(),
        platform: instance.Platform,
        architecture: instance.Architecture,
      },
      tags,
      region: this.region,
      accountId: this.accountId,
    };
  }

  private mapSecurityGroup(sg: SecurityGroup): AwsResource {
    const tags: Record<string, string> = {};

    for (const tag of sg.Tags || []) {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    }

    return {
      id: sg.GroupId || '',
      type: ResourceType.SecurityGroup,
      name: sg.GroupName || sg.GroupId || '',
      state: {
        description: sg.Description,
        vpcId: sg.VpcId,
        ingressRules: sg.IpPermissions?.map((rule) => ({
          ipProtocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges?.map((r) => r.CidrIp),
          ipv6Ranges: rule.Ipv6Ranges?.map((r) => r.CidrIpv6),
          userIdGroupPairs: rule.UserIdGroupPairs?.map((p) => p.GroupId),
        })),
        egressRules: sg.IpPermissionsEgress?.map((rule) => ({
          ipProtocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges?.map((r) => r.CidrIp),
          ipv6Ranges: rule.Ipv6Ranges?.map((r) => r.CidrIpv6),
          userIdGroupPairs: rule.UserIdGroupPairs?.map((p) => p.GroupId),
        })),
      },
      tags,
      region: this.region,
      accountId: this.accountId,
    };
  }

  private mapRDSInstance(instance: DBInstance): AwsResource {
    const tags: Record<string, string> = {};

    for (const tag of instance.TagList || []) {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    }

    return {
      id: instance.DBInstanceIdentifier || 'unknown',
      type: ResourceType.RDS,
      name: tags['Name'] || instance.DBInstanceIdentifier || 'unknown',
      state: {
        // Basic config
        instanceClass: instance.DBInstanceClass,
        engine: instance.Engine,
        engineVersion: instance.EngineVersion,
        allocatedStorage: instance.AllocatedStorage,
        storageType: instance.StorageType,

        // Availability
        multiAZ: instance.MultiAZ,
        availabilityZone: instance.AvailabilityZone,
        status: instance.DBInstanceStatus,

        // Backup config
        backupRetentionPeriod: instance.BackupRetentionPeriod,
        preferredBackupWindow: instance.PreferredBackupWindow,
        preferredMaintenanceWindow: instance.PreferredMaintenanceWindow,
        autoMinorVersionUpgrade: instance.AutoMinorVersionUpgrade,
      },
      tags,
      region: this.region,
      accountId: this.accountId,
    };
  }

  private mapS3Bucket(bucket: Bucket, configs: any): AwsResource {
    const tags: Record<string, string> = configs.tags.status === 'fulfilled' ?
      configs.tags.value.TagSet?.reduce((acc: Record<string, string>, tag: any) => {
        if (tag.Key) acc[tag.Key] = tag.Value || '';
        return acc;
      }, {} as Record<string, string>) : {};

    return {
      id: bucket.Name || 'unknown',
      type: ResourceType.S3,
      name: tags['Name'] || bucket.Name || 'unknown',
      state: {
        creationDate: bucket.CreationDate?.toISOString(),

        // Versioning
        versioning: configs.versioning.status === 'fulfilled' ? {
          status: configs.versioning.value.Status,
          mfaDelete: configs.versioning.value.MFADelete,
        } : null,

        // Encryption
        encryption: configs.encryption.status === 'fulfilled' ? {
          rules: configs.encryption.value.ServerSideEncryptionConfiguration?.Rules,
        } : null,

        // Lifecycle
        lifecycle: configs.lifecycle.status === 'fulfilled' ? {
          rules: configs.lifecycle.value.Rules?.map((rule: any) => ({
            id: rule.ID,
            status: rule.Status,
            expiration: rule.Expiration,
            transitions: rule.Transitions,
          })),
        } : null,

        // Public access block
        publicAccessBlock: configs.publicAccess.status === 'fulfilled' ? {
          blockPublicAcls: configs.publicAccess.value.PublicAccessBlockConfiguration?.BlockPublicAcls,
          ignorePublicAcls: configs.publicAccess.value.PublicAccessBlockConfiguration?.IgnorePublicAcls,
          blockPublicPolicy: configs.publicAccess.value.PublicAccessBlockConfiguration?.BlockPublicPolicy,
          restrictPublicBuckets: configs.publicAccess.value.PublicAccessBlockConfiguration?.RestrictPublicBuckets,
        } : null,
      },
      tags,
      region: this.region,
      accountId: this.accountId,
    };
  }
}
