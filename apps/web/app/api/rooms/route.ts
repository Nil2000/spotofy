import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@repo/db";
import { z } from "zod";

const createRoomBodySchema = z.object({
  name: z.string().trim().min(1),
  autoApproveSongs: z.boolean().optional(),
  autoApproveUsers: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireSession(req);
  if (!authResult.ok) {
    return authResult.response;
  }
  const { session } = authResult;

  const rooms = await prisma.room.findMany({
    where: { adminId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      autoApproveSongs: true,
      autoApproveUsers: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const authResult = await requireSession(req);
  if (!authResult.ok) {
    return authResult.response;
  }
  const { session } = authResult;

  const parsedBody = createRoomBodySchema.safeParse(await req.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Room name is required" },
      { status: 400 },
    );
  }

  const { name, autoApproveSongs, autoApproveUsers } = parsedBody.data;

  const room = await prisma.room.create({
    data: {
      name,
      adminId: session.user.id,
      autoApproveSongs: autoApproveSongs ?? false,
      autoApproveUsers: autoApproveUsers ?? false,
      maxUpvotes: 10,
      maxUsers: 10,
    },
    select: {
      id: true,
      name: true,
      autoApproveSongs: true,
      autoApproveUsers: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ room }, { status: 201 });
}
