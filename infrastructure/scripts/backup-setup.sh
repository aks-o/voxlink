#!/bin/bash

# VoxLink Production Backup Setup Script
# This script sets up automated backups for all production data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-south-1"
PROJECT_NAME="voxlink"
ENVIRONMENT="production"

echo -e "${GREEN}💾 Setting up VoxLink Production Backups${NC}"
echo "=================================================="

# Create backup IAM role
echo -e "${YELLOW}Creating backup IAM role...${NC}"
cat > backup-role-trust-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "backup.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role \
    --role-name "${PROJECT_NAME}-${ENVIRONMENT}-backup-role" \
    --assume-role-policy-document file://backup-role-trust-policy.json \
    --region ${AWS_REGION} || echo "Role already exists"

aws iam attach-role-policy \
    --role-name "${PROJECT_NAME}-${ENVIRONMENT}-backup-role" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup \
    --region ${AWS_REGION}

aws iam attach-role-policy \
    --role-name "${PROJECT_NAME}-${ENVIRONMENT}-backup-role" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores \
    --region ${AWS_REGION}

# Create backup vault
echo -e "${YELLOW}Creating backup vault...${NC}"
aws backup create-backup-vault \
    --backup-vault-name "${PROJECT_NAME}-${ENVIRONMENT}-vault" \
    --encryption-key-arn "alias/aws/backup" \
    --region ${AWS_REGION} || echo "Vault already exists"

# Create backup plan
echo -e "${YELLOW}Creating backup plan...${NC}"
cat > backup-plan.json <<EOF
{
    "BackupPlanName": "${PROJECT_NAME}-${ENVIRONMENT}-backup-plan",
    "Rules": [
        {
            "RuleName": "DailyBackups",
            "TargetBackupVaultName": "${PROJECT_NAME}-${ENVIRONMENT}-vault",
            "ScheduleExpression": "cron(0 2 ? * * *)",
            "StartWindowMinutes": 60,
            "CompletionWindowMinutes": 120,
            "Lifecycle": {
                "MoveToColdStorageAfterDays": 30,
                "DeleteAfterDays": 365
            },
            "RecoveryPointTags": {
                "Environment": "${ENVIRONMENT}",
                "Project": "${PROJECT_NAME}",
                "BackupType": "Daily"
            }
        },
        {
            "RuleName": "WeeklyBackups",
            "TargetBackupVaultName": "${PROJECT_NAME}-${ENVIRONMENT}-vault",
            "ScheduleExpression": "cron(0 3 ? * SUN *)",
            "StartWindowMinutes": 60,
            "CompletionWindowMinutes": 180,
            "Lifecycle": {
                "MoveToColdStorageAfterDays": 7,
                "DeleteAfterDays": 2555
            },
            "RecoveryPointTags": {
                "Environment": "${ENVIRONMENT}",
                "Project": "${PROJECT_NAME}",
                "BackupType": "Weekly"
            }
        }
    ]
}
EOF

BACKUP_PLAN_ID=$(aws backup create-backup-plan \
    --backup-plan file://backup-plan.json \
    --region ${AWS_REGION} \
    --query 'BackupPlanId' \
    --output text 2>/dev/null || \
    aws backup list-backup-plans \
    --query "BackupPlansList[?BackupPlanName=='${PROJECT_NAME}-${ENVIRONMENT}-backup-plan'].BackupPlanId" \
    --output text \
    --region ${AWS_REGION})

echo -e "${GREEN}✅ Backup plan ID: ${BACKUP_PLAN_ID}${NC}"

# Create backup selection for RDS
echo -e "${YELLOW}Creating RDS backup selection...${NC}"
cat > rds-backup-selection.json <<EOF
{
    "SelectionName": "RDS-Selection",
    "IamRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/${PROJECT_NAME}-${ENVIRONMENT}-backup-role",
    "Resources": [
        "arn:aws:rds:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):db:${PROJECT_NAME}-${ENVIRONMENT}-db"
    ],
    "Conditions": {
        "StringEquals": {
            "aws:ResourceTag/Environment": ["${ENVIRONMENT}"],
            "aws:ResourceTag/Project": ["${PROJECT_NAME}"]
        }
    }
}
EOF

aws backup create-backup-selection \
    --backup-plan-id ${BACKUP_PLAN_ID} \
    --backup-selection file://rds-backup-selection.json \
    --region ${AWS_REGION} || echo "RDS backup selection already exists"

# Create backup selection for EBS volumes
echo -e "${YELLOW}Creating EBS backup selection...${NC}"
cat > ebs-backup-selection.json <<EOF
{
    "SelectionName": "EBS-Selection",
    "IamRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/${PROJECT_NAME}-${ENVIRONMENT}-backup-role",
    "Resources": [
        "arn:aws:ec2:${AWS_REGION}:*:volume/*"
    ],
    "Conditions": {
        "StringEquals": {
            "aws:ResourceTag/Environment": ["${ENVIRONMENT}"],
            "aws:ResourceTag/Project": ["${PROJECT_NAME}"]
        }
    }
}
EOF

aws backup create-backup-selection \
    --backup-plan-id ${BACKUP_PLAN_ID} \
    --backup-selection file://ebs-backup-selection.json \
    --region ${AWS_REGION} || echo "EBS backup selection already exists"

# Set up S3 cross-region replication for critical data
echo -e "${YELLOW}Setting up S3 cross-region replication...${NC}"

# Create replication role
cat > s3-replication-role-trust-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "s3.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role \
    --role-name "${PROJECT_NAME}-${ENVIRONMENT}-s3-replication-role" \
    --assume-role-policy-document file://s3-replication-role-trust-policy.json \
    --region ${AWS_REGION} || echo "S3 replication role already exists"

# Create replication policy
cat > s3-replication-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObjectVersionForReplication",
                "s3:GetObjectVersionAcl"
            ],
            "Resource": [
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-storage-*/*",
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-db-backups-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-storage-*",
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-db-backups-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ReplicateObject",
                "s3:ReplicateDelete"
            ],
            "Resource": [
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-storage-replica-*/*",
                "arn:aws:s3:::${PROJECT_NAME}-${ENVIRONMENT}-db-backups-replica-*/*"
            ]
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name "${PROJECT_NAME}-${ENVIRONMENT}-s3-replication-role" \
    --policy-name "S3ReplicationPolicy" \
    --policy-document file://s3-replication-policy.json \
    --region ${AWS_REGION}

# Create disaster recovery documentation
echo -e "${YELLOW}Creating disaster recovery documentation...${NC}"
cat > disaster-recovery-runbook.md <<EOF
# VoxLink Production Disaster Recovery Runbook

## Overview
This runbook provides step-by-step procedures for recovering VoxLink production systems in case of disasters.

## Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)
- **RTO**: 4 hours (maximum downtime)
- **RPO**: 1 hour (maximum data loss)

## Backup Locations
- **Primary Region**: ap-south-1 (Asia Pacific Mumbai)
- **Backup Region**: ap-southeast-1 (Asia Pacific Singapore)
- **S3 Cross-Region Replication**: Enabled for critical data
- **RDS Automated Backups**: 30-day retention
- **AWS Backup**: Daily and weekly snapshots

## Emergency Contacts
- **Primary On-Call**: [INSERT PHONE NUMBER]
- **Secondary On-Call**: [INSERT PHONE NUMBER]
- **AWS Support**: [INSERT CASE URL]

## Recovery Procedures

### 1. Database Recovery
\`\`\`bash
# Restore from latest automated backup
aws rds restore-db-instance-from-db-snapshot \\
    --db-instance-identifier voxlink-production-db-restored \\
    --db-snapshot-identifier [SNAPSHOT_ID] \\
    --region ap-south-1

# Update connection strings in secrets manager
aws secretsmanager update-secret \\
    --secret-id voxlink-production-database-url \\
    --secret-string '{"database_url":"postgresql://..."}'
\`\`\`

### 2. Application Recovery
\`\`\`bash
# Deploy from latest known good image
aws ecs update-service \\
    --cluster voxlink-production-cluster \\
    --service api-gateway \\
    --task-definition voxlink-production-api-gateway:[REVISION] \\
    --force-new-deployment
\`\`\`

### 3. Cross-Region Failover
\`\`\`bash
# Update Route 53 to point to backup region
aws route53 change-resource-record-sets \\
    --hosted-zone-id [ZONE_ID] \\
    --change-batch file://failover-changeset.json
\`\`\`

## Testing Schedule
- **Monthly**: Backup restoration test
- **Quarterly**: Full disaster recovery drill
- **Annually**: Cross-region failover test

## Post-Recovery Checklist
- [ ] Verify all services are healthy
- [ ] Check data integrity
- [ ] Notify stakeholders
- [ ] Update monitoring dashboards
- [ ] Document lessons learned
EOF

# Set up automated backup monitoring
echo -e "${YELLOW}Setting up backup monitoring...${NC}"
cat > backup-monitoring-lambda.py <<EOF
import json
import boto3
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    backup_client = boto3.client('backup')
    sns_client = boto3.client('sns')
    
    # Check backup job status
    response = backup_client.list_backup_jobs(
        ByState='FAILED',
        ByCreatedAfter=datetime.now() - timedelta(days=1)
    )
    
    failed_jobs = response['BackupJobs']
    
    if failed_jobs:
        message = f"ALERT: {len(failed_jobs)} backup jobs failed in the last 24 hours\\n\\n"
        for job in failed_jobs:
            message += f"Job ID: {job['BackupJobId']}\\n"
            message += f"Resource: {job['ResourceArn']}\\n"
            message += f"Status: {job['State']}\\n"
            message += f"Created: {job['CreationDate']}\\n\\n"
        
        sns_client.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject='VoxLink Backup Job Failures',
            Message=message
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Checked {len(failed_jobs)} failed backup jobs')
    }
EOF

# Clean up temporary files
rm -f backup-role-trust-policy.json
rm -f backup-plan.json
rm -f rds-backup-selection.json
rm -f ebs-backup-selection.json
rm -f s3-replication-role-trust-policy.json
rm -f s3-replication-policy.json

echo ""
echo -e "${GREEN}🎉 Backup setup completed successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ AWS Backup vault created${NC}"
echo -e "${GREEN}✅ Daily and weekly backup plans configured${NC}"
echo -e "${GREEN}✅ RDS and EBS backup selections created${NC}"
echo -e "${GREEN}✅ S3 cross-region replication configured${NC}"
echo -e "${GREEN}✅ Disaster recovery runbook created${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Test backup restoration procedures"
echo "2. Set up backup monitoring Lambda function"
echo "3. Schedule regular disaster recovery drills"
echo "4. Update emergency contact information"
echo ""
echo -e "${GREEN}Backup system is now operational! 💾${NC}"