import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { z } from "zod";

const createRoomBodySchema = z.object({
  name: z.string().trim().min(1),
  autoApprove: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = await prisma.room.findMany({
    where: { adminId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      autoApprove: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = createRoomBodySchema.safeParse(await req.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Room name is required" },
      { status: 400 },
    );
  }

  const { name, autoApprove } = parsedBody.data;

  const room = await prisma.room.create({
    data: {
      name,
      adminId: session.user.id,
      autoApprove: autoApprove ?? false,
      maxUpvotes: 10,
      maxUsers: 10,
    },
    select: {
      id: true,
      name: true,
      autoApprove: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ room }, { status: 201 });
}
