/*
  Warnings:

  - Made the column `userId` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "key" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "fileId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_fileId_idx" ON "Message"("fileId");
