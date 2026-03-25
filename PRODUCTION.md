# Production Database Configuration (AWS RDS)

This document outlines the recommended configuration for deploying the Flori-Core database to AWS RDS.

## AWS RDS Instance Settings

| Setting | Recommended Value | Rationale |
|---|---|---|
| **Engine** | PostgreSQL 16.x | Consistency with local dev environment |
| **Instance Class** | `db.t4g.medium` (or higher) | Graviton3 for better price/performance |
| **Storage Type** | gp3 | Baseline performance with 3000 iOPS |
| **Multi-AZ** | Enabled | Critical for enterprise high availability |
| **Encryption** | Enabled (AWS KMS) | HIPAA/Enterprise compliance |

## TimescaleDB Extension

Flori-Core uses TimescaleDB for IoT sensor data. After launching the RDS instance, run the following command as a superuser:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

> [!IMPORTANT]
> Ensure your RDS Parameter Group has `timescaledb` added to `shared_preload_libraries`.

## Connection String (Environment Variable)

In production (`.env.production`), the `DATABASE_URL` should follow this format:

```
DATABASE_URL="postgresql://<user>:<password>@<rds-endpoint>:5432/<dbname>?sslmode=verify-full&schema=public"
```

## Security Group Rules

| Direction | Port | Source | Description |
|---|---|---|---|
| Inbound | 5432 | ECS Fargate Security Group | Allow API traffic |
| Inbound | 5432 | Admin VPN / Bastion | Secure management access |

## Backup & Retention
- **Automated Backups**: Enabled (7-day minimum retention)
- **Snapshot frequency**: Daily
- **Point-in-Time Recovery**: Guaranteed within the retention window
