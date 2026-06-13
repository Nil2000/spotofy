import * as jose from "jose";

export type WsTokenPayload = {
  userId: string;
  roomId: string;
};

function getWsSecret(): Uint8Array {
  const secret = process.env.WS_SECRET;
  if (!secret) {
    throw new Error("WS_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyRoomToken(
  token: string | null | undefined,
): Promise<WsTokenPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, getWsSecret());
    const userId = payload.userId;
    const roomId = payload.roomId;

    if (typeof userId !== "string" || !userId) return null;
    if (typeof roomId !== "string" || !roomId) return null;

    return { userId, roomId };
  } catch {
    return null;
  }
}
