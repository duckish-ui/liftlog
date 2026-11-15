import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { parseBody, workoutSchema } from "@/lib/validation";
import { exercisesAllowed, getWorkoutDetail, toSetRows } from "@/lib/workouts";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => NextResponse.json({ error: "Workout not found" }, { status: 404 });

// GET /api/workouts/:id
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const workout = await getWorkoutDetail(auth.userId, id);
  return workout ? NextResponse.json(workout) : notFound();
}

// PUT /api/workouts/:id — replace the workout's details and sets.
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const parsed = await parseBody(req, workoutSchema);
  if ("error" in parsed) return parsed.error;
  const input = parsed.data;

  const existing = await prisma.workout.findFirst({ where: { id, userId: auth.userId }, select: { id: true } });
  if (!existing) return notFound();
  if (!(await exercisesAllowed(auth.userId, input))) {
    return NextResponse.json({ error: "Unknown exercise" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.workoutSet.deleteMany({ where: { workoutId: id } }),
    prisma.workout.update({
      where: { id },
      data: {
        title: input.title,
        notes: input.notes,
        date: input.date,
        durationMin: input.durationMin,
        sets: { create: toSetRows(input) },
      },
    }),
  ]);
  return NextResponse.json(await getWorkoutDetail(auth.userId, id));
}

// DELETE /api/workouts/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const { count } = await prisma.workout.deleteMany({ where: { id, userId: auth.userId } });
  return count ? NextResponse.json({ ok: true }) : notFound();
}
