-- CreateTable
CREATE TABLE "spotify_oauth_state" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotify_oauth_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spotify_oauth_state_state_key" ON "spotify_oauth_state"("state");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_oauth_state_userId_key" ON "spotify_oauth_state"("userId");

-- AddForeignKey
ALTER TABLE "spotify_oauth_state" ADD CONSTRAINT "spotify_oauth_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
