import { prisma } from "@repo/db";
import type { UserPayload } from "../types";

export async function resolveUserPayload(
  userId: string,
  roomAdminId: string,
): Promise<UserPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    username: user.name || user.email.split("@")[0] || "User",
    isAdmin: userId === roomAdminId,
  };
}
