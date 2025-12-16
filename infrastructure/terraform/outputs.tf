# Outputs for VoxLink Production Infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_replica_endpoint" {
  description = "RDS read replica endpoint"
  value       = aws_db_instance.read_replica.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    api_gateway         = aws_ecr_repository.api_gateway.repository_url
    number_service      = aws_ecr_repository.number_service.repository_url
    billing_service     = aws_ecr_repository.billing_service.repository_url
    notification_service = aws_ecr_repository.notification_service.repository_url
    dashboard          = aws_ecr_repository.dashboard.repository_url
  }
}

output "s3_buckets" {
  description = "S3 bucket names"
  value = {
    app_storage    = aws_s3_bucket.app_storage.id
    db_backups     = aws_s3_bucket.db_backups.id
    static_assets  = aws_s3_bucket.static_assets.id
    alb_logs       = aws_s3_bucket.alb_logs.id
  }
}

output "secrets_manager_arns" {
  description = "Secrets Manager ARNs"
  value = {
    db_password        = aws_secretsmanager_secret.db_password.arn
    redis_auth_token   = aws_secretsmanager_secret.redis_auth_token.arn
  }
  sensitive = true
}

output "ssl_certificate_arn" {
  description = "SSL certificate ARN"
  value       = aws_acm_certificate.main.arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "target_group_arns" {
  description = "Target group ARNs"
  value = {
    api_gateway = aws_lb_target_group.api_gateway.arn
    dashboard   = aws_lb_target_group.dashboard.arn
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    alb   = aws_security_group.alb.id
    ecs   = aws_security_group.ecs.id
    rds   = aws_security_group.rds.id
    redis = aws_security_group.redis.id
  }
}

output "iam_role_arns" {
  description = "IAM role ARNs"
  value = {
    ecs_task_execution_role = aws_iam_role.ecs_task_execution_role.arn
    ecs_task_role          = aws_iam_role.ecs_task_role.arn
  }
}