import { auth } from "@/lib/auth";
import { SPOTIFY_BASE_URL, SPOTIFY_TOKEN_PATH } from "@/lib/constants";
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
  const baseUrl = process.env.WEB_APP_URL ?? req.nextUrl.origin;
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL(`${baseUrl}/login`));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${baseUrl}/admin?spotify=error&reason=${encodeURIComponent(error)}`,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${baseUrl}/admin?spotify=error&reason=invalid_state`),
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`${baseUrl}/admin?spotify=error&reason=config`),
    );
  }

  const redirectUri = `${baseUrl}/api/spotify/callback`;

  try {
    const oauthState = await prisma.spotifyOAuthState.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        state: true,
        expiresAt: true,
      },
    });

    if (
      !oauthState ||
      oauthState.state !== state ||
      oauthState.expiresAt.getTime() <= Date.now()
    ) {
      if (oauthState) {
        await prisma.spotifyOAuthState.delete({
          where: {
            id: oauthState.id,
          },
        });
      }

      return NextResponse.redirect(
        new URL(`${baseUrl}/admin?spotify=error&reason=invalid_state`),
      );
    }

    await prisma.spotifyOAuthState.delete({
      where: {
        id: oauthState.id,
      },
    });

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
      return NextResponse.redirect(
        new URL(`${baseUrl}/admin?spotify=error&reason=token_exchange`),
      );
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

    return NextResponse.redirect(new URL(`${baseUrl}/admin?spotify=connected`));
  } catch {
    return NextResponse.redirect(
      new URL(`${baseUrl}/admin?spotify=error&reason=server`),
    );
  }
}
