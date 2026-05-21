/*
  Warnings:

  - You are about to drop the column `reportingManagerName` on the `Admin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "reportingManagerName",
ADD COLUMN     "reportingManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
