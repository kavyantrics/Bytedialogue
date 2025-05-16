/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kindeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `url` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `key` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "key" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "kindeId" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "profileImage" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_kindeId_key" ON "User"("kindeId");
