import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseBody, signupSchema } from "@/lib/validation";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(req: Request) {
  const parsed = await parseBody(req, signupSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });

  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, await signSession({ userId: user.id, name: user.name }), sessionCookieOptions);
  return res;
}
