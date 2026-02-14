import { auth } from "@/lib/auth";
import {
  SPOTIFY_BASE_URL,
  SPOTIFY_OAUTH_STATE_COOKIE,
  SPOTIFY_TOKEN_PATH,
} from "@/lib/constants";
import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

type SpotifyTokenResponse = {
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const expectedState = req.cookies.get(SPOTIFY_OAUTH_STATE_COOKIE)?.value;

  if (error) {
    const response = NextResponse.redirect(
      new URL(
        `/admin?spotify=error&reason=${encodeURIComponent(error)}`,
        req.url,
      ),
    );
    response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(
      new URL("/admin?spotify=error&reason=invalid_state", req.url),
    );
    response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
    return response;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const response = NextResponse.redirect(
      new URL("/admin?spotify=error&reason=config", req.url),
    );
    response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
    return response;
  }

  const baseUrl = process.env.WEB_APP_URL ?? req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/spotify/callback`;

  try {
    const tokenResponse = await fetch(
      `${SPOTIFY_BASE_URL}${SPOTIFY_TOKEN_PATH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      },
    );

    if (!tokenResponse.ok) {
      const response = NextResponse.redirect(
        new URL("/admin?spotify=error&reason=token_exchange", req.url),
      );
      response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
      return response;
    }

    const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;
    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyTokenExpiresAt: tokenExpiresAt,
        isSpotifyConnected: true,
      },
    });

    const response = NextResponse.redirect(
      new URL("/admin?spotify=connected", req.url),
    );
    response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/admin?spotify=error&reason=server", req.url),
    );
    response.cookies.delete(SPOTIFY_OAUTH_STATE_COOKIE);
    return response;
  }
}
