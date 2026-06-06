-- AlterTable
ALTER TABLE "song" ADD COLUMN "requestedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "song_requestedByUserId_idx" ON "song"("requestedByUserId");

-- AddForeignKey
ALTER TABLE "song"
ADD CONSTRAINT "song_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
