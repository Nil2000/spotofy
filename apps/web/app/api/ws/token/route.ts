import { auth } from "@/lib/auth";
import { generateRoomToken } from "@/lib/room-utils";
import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  try {
    const token = await generateRoomToken(session.user.id, roomId);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "WebSocket authentication is not configured" },
      { status: 500 },
    );
  }
}
