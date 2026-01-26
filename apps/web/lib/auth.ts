import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@repo/db";

export const auth = betterAuth({
  database: prismaAdapter(PrismaClient, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
});
