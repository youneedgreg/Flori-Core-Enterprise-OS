/*
  Warnings:

  - The `status` column on the `rfq_responses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `rfqs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SENT', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RfqResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "rfq_responses" DROP COLUMN "status",
ADD COLUMN     "status" "RfqResponseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rfqs" DROP COLUMN "status",
ADD COLUMN     "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "RFQResponseStatus";

-- DropEnum
DROP TYPE "RFQStatus";
