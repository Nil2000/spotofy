import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

type RequireSessionResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function requireSession(
  req: NextRequest,
): Promise<RequireSessionResult> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, session };
}
