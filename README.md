# Flori-Core Enterprise OS

A production-grade, multi-tenant Agri-ERP designed to revolutionize high-altitude floriculture management. This system is engineered as a "Farm Operating System" that connects physical field operations (IoT) with global market logistics through a unified, secure digital nervous system.

---

## 🏗️ Architecture Stack

This repository is structured as a Monorepo using **Turborepo** and relies on the following core technologies:

- **Frontend:** Next.js (App Router), Tailwind CSS, React
- **Backend API:** NestJS, TypeScript
- **Database:** PostgreSQL (with TimescaleDB for IoT telemetry)
- **ORM:** Prisma Client
- **Caching & Sessions:** Redis
- **Package Manager:** pnpm 

---

## 📁 Repository Structure

```text
flori-core/
├── apps/
│   ├── web/        # Next.js frontend application
│   └── api/        # NestJS backend API service
├── packages/
│   └── shared/     # Shared Zod schemas, types, and configurations
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 🚀 Quick Start (Local Development)

Follow these steps to get your local environment running completely.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Setup

First, install monorepo dependencies:
```bash
pnpm install
```

Start up your local PostgreSQL and Redis containers using Docker Compose:
```bash
docker compose up -d db redis
```

Synchronize your Prisma schema with the running database and generate the Prisma Client:
```bash
pnpm --filter @flori/api exec prisma db push
```

Run the database seeder to populate default roles and the initial Gold Admin account:
```bash
npx tsx apps/api/prisma/seed.ts
```
*(Default test user: `admin@floricore.io` | Password: `admin123`)*

### 3. Run Development Servers

Finally, start the entire stack via Turborepo:
```bash
pnpm run dev
```
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001

---

## 🌐 Production Readiness
For information regarding production deployment on AWS and TimescaleDB details, see the [`PRODUCTION.md`](./PRODUCTION.md) guide as well as the overarching design spec at [`flori_core_plan.md`](./flori_core_plan.md).
