import { auth } from "@/lib/auth";
import { SPOTIFY_AUTHORIZE_PATH, SPOTIFY_BASE_URL } from "@/lib/constants";
import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const baseUrl = process.env.WEB_APP_URL ?? req.nextUrl.origin;
  if (!session) {
    return NextResponse.redirect(new URL(`${baseUrl}/login`));
  }

  if (!process.env.SPOTIFY_CLIENT_ID) {
    return NextResponse.redirect(
      new URL(`${baseUrl}/admin?spotify=error&reason=config`),
    );
  }

  const state = crypto.randomUUID();
  await prisma.spotifyOAuthState.upsert({
    where: {
      userId: session.user.id,
    },
    create: {
      userId: session.user.id,
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    update: {
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const scope =
    "streaming user-read-private user-read-email user-read-playback-state user-modify-playback-state";
  const redirectUri = `${baseUrl}/api/spotify/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const authUrl = `${SPOTIFY_BASE_URL}${SPOTIFY_AUTHORIZE_PATH}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
