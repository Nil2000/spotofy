import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireSession } from "@/lib/require-session";

export async function GET(req: NextRequest) {
  const authResult = await requireSession(req);
  if (!authResult.ok) {
    return authResult.response;
  }
  const { session } = authResult;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      spotifyAccessToken: true,
      isSpotifyConnected: true,
    },
  });

  if (!user || !user.isSpotifyConnected || !user.spotifyAccessToken) {
    return NextResponse.json(
      { error: "Spotify is not connected" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: "connected",
  });
}
