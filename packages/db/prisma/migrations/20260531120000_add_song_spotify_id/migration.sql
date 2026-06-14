-- AlterTable
ALTER TABLE "song" ADD COLUMN "songId" TEXT;

-- Backfill Spotify track IDs from existing URLs where possible
UPDATE "song"
SET "songId" = (regexp_match("url", 'track/([^/?]+)'))[1]
WHERE "songId" IS NULL;

-- Fall back to internal id for legacy rows without a parseable track URL
UPDATE "song"
SET "songId" = "id"
WHERE "songId" IS NULL OR "songId" = '';

ALTER TABLE "song" ALTER COLUMN "songId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "song_roomId_songId_idx" ON "song"("roomId", "songId");
