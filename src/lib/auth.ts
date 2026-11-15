import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySession } from "./session";

/** Current session from the cookie, or null. */
export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** For server components/pages: the logged-in user, or redirect to /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, unit: true },
  });
  if (!user) redirect("/login");
  return user;
}

/** For API route handlers: the user id, or a 401 response. */
export async function requireApiUser(): Promise<{ userId: string } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  return { userId: session.userId };
}
