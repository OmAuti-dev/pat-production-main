/*
  Warnings:

  - You are about to drop the column `progress` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `dependencies` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `requiredSkills` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `resourceUrl` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `googleResourceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `localGoogleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `taskLoad` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Campaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Connections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscordWebhook` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LocalGoogleCredential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectResource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectTeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Slack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workflows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_teamMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,teamId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Connections" DROP CONSTRAINT "Connections_discordWebhookId_fkey";

-- DropForeignKey
ALTER TABLE "Connections" DROP CONSTRAINT "Connections_notionId_fkey";

-- DropForeignKey
ALTER TABLE "Connections" DROP CONSTRAINT "Connections_slackId_fkey";

-- DropForeignKey
ALTER TABLE "Connections" DROP CONSTRAINT "Connections_userId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordWebhook" DROP CONSTRAINT "DiscordWebhook_userId_fkey";

-- DropForeignKey
ALTER TABLE "LocalGoogleCredential" DROP CONSTRAINT "LocalGoogleCredential_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notion" DROP CONSTRAINT "Notion_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_managerId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectResource" DROP CONSTRAINT "ProjectResource_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTeamMember" DROP CONSTRAINT "ProjectTeamMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTeamMember" DROP CONSTRAINT "ProjectTeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Slack" DROP CONSTRAINT "Slack_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProject" DROP CONSTRAINT "UserProject_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UserProject" DROP CONSTRAINT "UserProject_userId_fkey";

-- DropForeignKey
ALTER TABLE "Workflows" DROP CONSTRAINT "Workflows_userId_fkey";

-- DropForeignKey
ALTER TABLE "_teamMember" DROP CONSTRAINT "_teamMember_A_fkey";

-- DropForeignKey
ALTER TABLE "_teamMember" DROP CONSTRAINT "_teamMember_B_fkey";

-- DropIndex
DROP INDEX "TeamMember_teamId_userId_key";

-- DropIndex
DROP INDEX "User_googleResourceId_key";

-- DropIndex
DROP INDEX "User_localGoogleId_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "progress",
DROP COLUMN "type",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PLANNING',
ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "createdById",
DROP COLUMN "dependencies",
DROP COLUMN "dueDate",
DROP COLUMN "progress",
DROP COLUMN "requiredSkills",
DROP COLUMN "resourceUrl",
DROP COLUMN "teamId",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "deadline" TIMESTAMP(3),
ALTER COLUMN "projectId" DROP NOT NULL,
ALTER COLUMN "assignedToId" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "googleResourceId",
DROP COLUMN "localGoogleId",
DROP COLUMN "taskLoad",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- DropTable
DROP TABLE "Campaign";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Connections";

-- DropTable
DROP TABLE "DiscordWebhook";

-- DropTable
DROP TABLE "LocalGoogleCredential";

-- DropTable
DROP TABLE "Notion";

-- DropTable
DROP TABLE "ProjectResource";

-- DropTable
DROP TABLE "ProjectTeamMember";

-- DropTable
DROP TABLE "Slack";

-- DropTable
DROP TABLE "UserProject";

-- DropTable
DROP TABLE "Workflows";

-- DropTable
DROP TABLE "_teamMember";

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
