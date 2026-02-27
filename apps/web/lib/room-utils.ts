import { prisma } from "@repo/db";

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
