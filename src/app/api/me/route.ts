import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

// GET /api/me — the logged-in user's profile.
export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, unit: true, createdAt: true },
  });
  return user ? NextResponse.json(user) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
