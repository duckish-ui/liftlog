import "server-only";
import { prisma } from "./prisma";
import type { WorkoutInput } from "./validation";

/** Turn the nested {exercises:[{sets:[]}]} payload into flat WorkoutSet rows. */
export function toSetRows(input: WorkoutInput) {
  return input.exercises.flatMap((ex, order) =>
    ex.sets.map((s, i) => ({ exerciseId: ex.exerciseId, order, setNumber: i + 1, reps: s.reps, weight: s.weight })),
  );
}

/** Make sure every exercise id is either a library exercise or the user's own. */
export async function exercisesAllowed(userId: string, input: WorkoutInput) {
  const ids = [...new Set(input.exercises.map((e) => e.exerciseId))];
  const count = await prisma.exercise.count({
    where: { id: { in: ids }, OR: [{ userId: null }, { userId }] },
  });
  return count === ids.length;
}

/** A workout with its sets grouped by exercise, in logged order. */
export async function getWorkoutDetail(userId: string, id: string) {
  const workout = await prisma.workout.findFirst({
    where: { id, userId },
    include: {
      sets: {
        orderBy: [{ order: "asc" }, { setNumber: "asc" }],
        include: { exercise: { select: { id: true, name: true, category: true } } },
      },
    },
  });
  if (!workout) return null;

  const groups: { exercise: { id: string; name: string; category: string }; sets: { reps: number; weight: number }[] }[] = [];
  for (const s of workout.sets) {
    const last = groups[groups.length - 1];
    if (last && last.exercise.id === s.exercise.id && groups.length - 1 === s.order) {
      last.sets.push({ reps: s.reps, weight: s.weight });
    } else {
      groups.push({ exercise: s.exercise, sets: [{ reps: s.reps, weight: s.weight }] });
    }
  }
  return {
    id: workout.id,
    title: workout.title,
    notes: workout.notes,
    date: workout.date.toISOString(),
    durationMin: workout.durationMin,
    exercises: groups,
  };
}

export type WorkoutDetail = NonNullable<Awaited<ReturnType<typeof getWorkoutDetail>>>;
