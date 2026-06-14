import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@repo/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await params;

  const room = await prisma.room.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room });
}
