import { createAuthClient } from "better-auth/client";
const authClient = createAuthClient({
  baseURL: process.env.WEB_APP_URL,
});

export const { signIn, signOut } = authClient;
