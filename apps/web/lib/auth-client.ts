import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_WEB_APP_URL ?? process.env.WEB_APP_URL,
});

export const { signIn, signOut, useSession } = authClient;
