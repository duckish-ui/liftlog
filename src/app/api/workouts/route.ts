import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { parseBody, workoutSchema } from "@/lib/validation";
import { exercisesAllowed, toSetRows } from "@/lib/workouts";
import { volume } from "@/lib/stats";

// GET /api/workouts — the user's workouts, newest first, with summary numbers.
export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const workouts = await prisma.workout.findMany({
    where: { userId: auth.userId },
    orderBy: { date: "desc" },
    include: { sets: { select: { reps: true, weight: true, exerciseId: true } } },
  });

  return NextResponse.json(
    workouts.map((w) => ({
      id: w.id,
      title: w.title,
      date: w.date,
      durationMin: w.durationMin,
      exerciseCount: new Set(w.sets.map((s) => s.exerciseId)).size,
      setCount: w.sets.length,
      volume: volume(w.sets),
    })),
  );
}

// POST /api/workouts — save a logged workout.
export async function POST(req: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, workoutSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  if (!(await exercisesAllowed(auth.userId, input))) {
    return NextResponse.json({ error: "Unknown exercise" }, { status: 400 });
  }

  const workout = await prisma.workout.create({
    data: {
      userId: auth.userId,
      title: input.title,
      notes: input.notes,
      date: input.date,
      durationMin: input.durationMin,
      sets: { create: toSetRows(input) },
    },
  });
  return NextResponse.json({ id: workout.id }, { status: 201 });
}
