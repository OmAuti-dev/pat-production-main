-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleResourceId" TEXT;

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "publish" BOOLEAN NOT NULL DEFAULT false,
    "nodes" JSONB,
    "edges" JSONB,
    "discordTemplate" TEXT,
    "slackTemplate" TEXT,
    "slackAccessToken" TEXT,
    "slackChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notionTemplate" TEXT,
    "notionAccessToken" TEXT,
    "notionDbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
