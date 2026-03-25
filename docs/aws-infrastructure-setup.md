# Flori-Core Enterprise OS - AWS Infrastructure Setup

This guide details the infrastructure architecture for Flori-Core Enterprise OS on AWS. It covers deploying the NestJS API via ECS Fargate and serving static assets securely via S3 and CloudFront. The frontend Web Application is assumed to be deployed via Vercel for preview and production environments.

## 1. AWS ECS Fargate Setup (NestJS API)

The API is deployed as serverless containers using AWS ECS with the Fargate launch type.

### 1.1 Virtual Private Cloud (VPC)
- **Public Subnets**: Contain the Application Load Balancer (ALB) and NAT Gateway.
- **Private Subnets**: Contain the ECS Fargate tasks and RDS/TimescaleDB instances. Outbound internet access is routed via the NAT Gateway.

### 1.2 Elastic Container Registry (ECR)
- Create an ECR repository named `floricore/api` to store the API Docker images built via GitHub Actions (CD).

### 1.3 Application Load Balancer (ALB)
- Deploy an internet-facing ALB in the public subnets.
- Configure listeners on port 443 (HTTPS) with an ACM (AWS Certificate Manager) SSL certificate.
- Route incoming traffic to an ECS Target Group.

### 1.4 ECS Task Definition & Service
- **Task Definition**: Use the `floricore/api` image from ECR. Map container port to `3001` (or your configured port). Enable AWS CloudWatch logs via `awslogs` driver. Set environment variables (e.g., `DATABASE_URL`, `JWT_SECRET`, `SENTRY_DSN`) using AWS Systems Manager Parameter Store or Secrets Manager.
- **ECS Service**: Run behind the ALB. Configure Auto Scaling based on CPU/Memory utilization thresholds.

---

## 2. AWS S3 + CloudFront (Static Assets & Document Vault)

The S3 + CloudFront combination securely handles exporting document vaults, QR code labels, and user profile images.

### 2.1 S3 Bucket
- Create a private S3 bucket named `floricore-assets-[env]-[id]`.
- Block all public access at the bucket level.
- Create folders: `/public` (for public UI assets if needed), `/vault` (for secure documents, phytosanitary certs).

### 2.2 CloudFront Distribution
- Set the S3 bucket as the origin.
- **Origin Access Control (OAC)**: Ensure CloudFront is the only entity permitted to read from the S3 bucket.
- Update the S3 Bucket Policy to allow `s3:GetObject` only if the condition `aws:SourceArn` matches the CloudFront distribution ARN.
- Configure an ACM certificate and alternative domain name (e.g., `assets.flori-core.com`).

### 2.3 Presigned URLs for Secure Documents
- The API will generate short-lived S3 Presigned URLs when users request Export Documents, Payslips, or Route Plans.
- CloudFront can be configured to forward specific headers, or signed URLs can be generated via CloudFront URL Signing for optimal caching and security.
