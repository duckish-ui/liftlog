import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { customExerciseSchema, parseBody } from "@/lib/validation";

// GET /api/exercises?q=bench&category=Chest&limit=30
// Library exercises (from wger) plus the current user's custom exercises.
export async function GET(req: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);

  const where: Prisma.ExerciseWhereInput = {
    AND: [
      { OR: [{ userId: null }, { userId: auth.userId }] },
      q ? { name: { contains: q, mode: "insensitive" } } : {},
      category ? { category } : {},
    ],
  };

  const select = { id: true, name: true, category: true, muscles: true, equipment: true, userId: true } as const;

  // Rank names that start with the query ("Squats" for "squat") above ones that merely contain it.
  const prefix = q
    ? await prisma.exercise.findMany({
        where: { AND: [where, { name: { startsWith: q, mode: "insensitive" } }] },
        orderBy: [{ name: "asc" }],
        take: limit,
        select,
      })
    : [];
  const rest = await prisma.exercise.findMany({
    where: { AND: [where, { id: { notIn: prefix.map((e) => e.id) } }] },
    orderBy: [{ name: "asc" }],
    take: limit - prefix.length,
    select,
  });

  return NextResponse.json([...prefix, ...rest].map(({ userId, ...e }) => ({ ...e, custom: userId !== null })));
}

// POST /api/exercises — create a custom exercise for the current user.
export async function POST(req: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, customExerciseSchema);
  if ("error" in parsed) return parsed.error;

  const exercise = await prisma.exercise.create({ data: { ...parsed.data, userId: auth.userId } });
  return NextResponse.json(exercise, { status: 201 });
}
