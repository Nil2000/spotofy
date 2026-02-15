-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isSpotifyConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spotifyAccessToken" TEXT,
ADD COLUMN     "spotifyRefreshToken" TEXT,
ADD COLUMN     "spotifyTokenExpiresAt" TIMESTAMP(3);
