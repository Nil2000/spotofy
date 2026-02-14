import { auth } from "@/lib/auth";
import {
  SPOTIFY_AUTHORIZE_PATH,
  SPOTIFY_BASE_URL,
  SPOTIFY_OAUTH_STATE_COOKIE,
} from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!process.env.SPOTIFY_CLIENT_ID) {
    return NextResponse.redirect(
      new URL("/admin?spotify=error&reason=config", req.url),
    );
  }

  const state = crypto.randomUUID();
  const scope =
    "streaming user-read-private user-read-email user-read-playback-state user-modify-playback-state";
  const baseUrl = process.env.WEB_APP_URL ?? req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/spotify/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const authUrl = `${SPOTIFY_BASE_URL}${SPOTIFY_AUTHORIZE_PATH}?${params.toString()}`;
  const response = NextResponse.redirect(authUrl);

  response.cookies.set(SPOTIFY_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
