import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import ClientPage from "./_components/_client";
import SpotifyWebPlayer from "./_components/spotify-player";
import { isRoomAdmin } from "@/lib/room-utils";

type RoomPageProps = {
  params: { code: string };
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = {
    userId: session.user.id,
    email: session.user.email,
    username: session.user.name || session.user.email.split("@")[0] || "User",
    isAdmin: await isRoomAdmin(code, session.user.id),
  };

  let spotifyToken: string | null = null;

  if (user.isAdmin) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        spotifyAccessToken: true,
        isSpotifyConnected: true,
      },
    });

    if (dbUser?.isSpotifyConnected && dbUser.spotifyAccessToken) {
      spotifyToken = dbUser.spotifyAccessToken;
    }
  }

  return (
    <>
      <ClientPage code={code} user={user} />
      {user.isAdmin && spotifyToken && (
        <SpotifyWebPlayer token={spotifyToken} />
      )}
    </>
  );
}
