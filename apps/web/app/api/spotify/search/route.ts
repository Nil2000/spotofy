import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { SPOTIFY_BASE_URL, SPOTIFY_TOKEN_PATH } from "@/lib/constants";

type SpotifyRefreshResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  external_urls: { spotify: string };
  duration_ms: number;
};

type SpotifySearchResponse = {
  tracks: {
    items: SpotifyTrack[];
  };
};

export type SearchResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  imgUrl: string;
  url: string;
  durationMs: number;
};

async function getValidToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
      isSpotifyConnected: true,
    },
  });

  if (!user?.isSpotifyConnected || !user.spotifyAccessToken) return null;

  const now = Date.now();
  const expiresAt = user.spotifyTokenExpiresAt?.getTime() ?? 0;
  const needsRefresh = expiresAt <= now + 60_000;

  if (!needsRefresh) return user.spotifyAccessToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!user.spotifyRefreshToken || !clientId || !clientSecret) return null;

  const res = await fetch(`${SPOTIFY_BASE_URL}${SPOTIFY_TOKEN_PATH}`, {
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

  if (!res.ok) return null;

  const data = (await res.json()) as SpotifyRefreshResponse;

  await prisma.user.update({
    where: { id: userId },
    data: {
      spotifyAccessToken: data.access_token,
      spotifyRefreshToken: data.refresh_token ?? user.spotifyRefreshToken,
      spotifyTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const accessToken = await getValidToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Spotify not connected" },
      { status: 403 },
    );
  }

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "8");

  const spotifyRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!spotifyRes.ok) {
    return NextResponse.json(
      { error: "Spotify search failed" },
      { status: 502 },
    );
  }

  const data = (await spotifyRes.json()) as SpotifySearchResponse;

  const results: SearchResult[] = data.tracks.items.map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    album: track.album.name,
    imgUrl: track.album.images[0]?.url ?? "",
    url: track.external_urls.spotify,
    durationMs: track.duration_ms,
  }));

  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
