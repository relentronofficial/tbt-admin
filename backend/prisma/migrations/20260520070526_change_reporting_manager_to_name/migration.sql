/*
  Warnings:

  - You are about to drop the column `reportingManagerId` on the `Admin` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_reportingManagerId_fkey";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "reportingManagerId",
ADD COLUMN     "reportingManagerName" TEXT;
