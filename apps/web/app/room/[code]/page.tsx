import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ClientPage from "./_components/_client";

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
    isAdmin: false, // This can be extended based on your admin logic
  };

  return <ClientPage code={code} user={user} />;
}
