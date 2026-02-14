import { auth } from "@/lib/auth";
import { SPOTIFY_BASE_URL, SPOTIFY_TOKEN_PATH } from "@/lib/constants";
import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

type SpotifyRefreshResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

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
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
      isSpotifyConnected: true,
    },
  });

  if (!user || !user.isSpotifyConnected || !user.spotifyAccessToken) {
    return NextResponse.json(
      { error: "Spotify is not connected" },
      { status: 404 },
    );
  }

  const now = Date.now();
  const refreshBufferMs = 60 * 1000;
  const tokenExpiresAtMs = user.spotifyTokenExpiresAt?.getTime() ?? 0;
  const shouldRefresh =
    !user.spotifyTokenExpiresAt || tokenExpiresAtMs <= now + refreshBufferMs;

  let accessToken = user.spotifyAccessToken;
  let tokenExpiresAt = user.spotifyTokenExpiresAt;

  if (shouldRefresh) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!user.spotifyRefreshToken || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Spotify token cannot be refreshed" },
        { status: 400 },
      );
    }

    const refreshResponse = await fetch(`${SPOTIFY_BASE_URL}${SPOTIFY_TOKEN_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }).toString(),
    });

    if (!refreshResponse.ok) {
      return NextResponse.json(
        { error: "Failed to refresh Spotify token" },
        { status: 502 },
      );
    }

    const refreshData = (await refreshResponse.json()) as SpotifyRefreshResponse;

    accessToken = refreshData.access_token;
    tokenExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshData.refresh_token ?? user.spotifyRefreshToken,
        spotifyTokenExpiresAt: tokenExpiresAt,
        isSpotifyConnected: true,
      },
    });
  }

  return NextResponse.json(
    {
      accessToken,
      expiresAt: tokenExpiresAt?.toISOString() ?? null,
      isSpotifyConnected: true,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
