import AdminClient from "./_components/_client";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = await prisma.user.findUnique({
    where: {
      id: session?.user.id,
    },
    select: {
      isSpotifyConnected: true,
    },
  });

  return <AdminClient isSpotifyConnected={user?.isSpotifyConnected ?? false} />;
}
