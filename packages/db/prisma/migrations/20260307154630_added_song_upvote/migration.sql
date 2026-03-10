-- CreateTable
CREATE TABLE "song_upvote_history" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_upvote_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "song_upvote_history_roomId_userId_idx" ON "song_upvote_history"("roomId", "userId");

-- CreateIndex
CREATE INDEX "song_upvote_history_songId_idx" ON "song_upvote_history"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "song_upvote_history_roomId_songId_userId_key" ON "song_upvote_history"("roomId", "songId", "userId");
