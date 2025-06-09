/*
  Warnings:

  - You are about to drop the `TaskComment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskComment" DROP CONSTRAINT "TaskComment_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskComment" DROP CONSTRAINT "TaskComment_userId_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "taskId" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- DropTable
DROP TABLE "TaskComment";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
