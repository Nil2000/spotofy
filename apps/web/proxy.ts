import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  authRoutes,
  authProtectedRoutes,
  DEFAULT_LOGIN_REDIRECT_URL,
  publicRoutes,
  authPrefix,
  protectedRoutes,
} from "./lib/routes";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  // if (!session) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // console.log(session);

  const isLoggedIn = !!session;
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isApiAuthRoute = authPrefix.includes(request.nextUrl.pathname);
  const isProtectedRoute = protectedRoutes.includes(request.nextUrl.pathname);
  // const isAuthProtectedRoute=authProtectedRoutes.includes(request.nextUrl.pathname);

  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(
      new URL(DEFAULT_LOGIN_REDIRECT_URL, request.url),
    );
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)", "/"], // Specify the routes the middleware applies to
};
