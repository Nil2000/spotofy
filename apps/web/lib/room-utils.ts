import { prisma } from "@repo/db";
import * as jose from "jose";

export async function isRoomAdmin(code: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: {
      id: code,
    },
  });

  if (!room) {
    return false;
  }

  return room.adminId === userId;
}

function getWsSecret(): Uint8Array {
  const secret = process.env.WS_SECRET;
  if (!secret) {
    throw new Error("WS_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function generateRoomToken(userId: string, roomId: string) {
  return new jose.SignJWT({ userId, roomId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getWsSecret());
}
