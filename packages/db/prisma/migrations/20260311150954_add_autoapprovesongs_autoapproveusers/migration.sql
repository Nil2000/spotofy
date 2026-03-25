/*
  Warnings:

  - You are about to drop the column `autoApprove` on the `room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "room" DROP COLUMN "autoApprove",
ADD COLUMN     "autoApproveSongs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoApproveUsers" BOOLEAN NOT NULL DEFAULT false;
