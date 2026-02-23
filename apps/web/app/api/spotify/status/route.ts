import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
