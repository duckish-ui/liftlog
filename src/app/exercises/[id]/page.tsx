import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fetchWgerExercise } from "@/lib/wger";
import { e1rm, formatDate } from "@/lib/stats";
import { ProgressChart } from "@/components/Charts";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await prisma.exercise.findUnique({ where: { id }, select: { name: true } });
  return { title: e?.name ?? "Exercise" };
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId: user.id }] },
  });
  if (!exercise) notFound();

  // Live details (image, full description, secondary muscles) from the wger API.
  const [wger, sets] = await Promise.all([
    exercise.wgerId ? fetchWgerExercise(exercise.wgerId) : Promise.resolve(null),
    prisma.workoutSet.findMany({
      where: { exerciseId: id, workout: { userId: user.id } },
      include: { workout: { select: { id: true, title: true, date: true } } },
      orderBy: [{ workout: { date: "asc" } }, { setNumber: "asc" }],
    }),
  ]);

  // One point per workout: heaviest set and best estimated 1RM.
  const sessions = new Map<string, { id: string; title: string; date: Date; sets: { reps: number; weight: number }[] }>();
  for (const s of sets) {
    const cur = sessions.get(s.workout.id) ?? { ...s.workout, sets: [] };
    cur.sets.push({ reps: s.reps, weight: s.weight });
    sessions.set(s.workout.id, cur);
  }
  const history = [...sessions.values()];
  const chart = history.map((h) => ({
    label: formatDate(h.date, { month: "short", day: "numeric" }),
    best: Math.max(...h.sets.map((s) => s.weight)),
    e1rm: Math.max(...h.sets.map(e1rm)),
  }));
  const pr = sets.reduce<{ reps: number; weight: number } | null>((a, b) => (!a || e1rm(b) > e1rm(a) ? b : a), null);
  const heaviest = sets.reduce((m, s) => Math.max(m, s.weight), 0);

  const description = wger?.description || exercise.description;
  const muscles = wger?.muscles.length ? wger.muscles : exercise.muscles;
  const secondary = wger?.secondaryMuscles ?? [];
  const equipment = wger?.equipment.length ? wger.equipment : exercise.equipment;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/exercises" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Exercises
      </Link>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row">
          {wger?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wger.image} alt={exercise.name} className="h-40 w-full rounded-xl bg-white object-contain sm:w-48" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{exercise.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip border-brand/40 text-brand">{exercise.category}</span>
              {exercise.userId && <span className="chip">custom</span>}
              {equipment.map((e) => (
                <span key={e} className="chip">
                  {e}
                </span>
              ))}
            </div>
            {muscles.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="text-muted">Primary: </span>
                {muscles.join(", ")}
              </p>
            )}
            {secondary.length > 0 && (
              <p className="mt-1 text-sm">
                <span className="text-muted">Secondary: </span>
                {secondary.join(", ")}
              </p>
            )}
          </div>
        </div>
        {description && (
          <div className="whitespace-pre-line border-t border-line p-5 text-sm leading-relaxed text-zinc-300">{description}</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="card p-4">
          <div className="text-xl font-bold">{history.length}</div>
          <div className="text-xs text-muted">sessions</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold">
            {heaviest} <span className="text-sm text-muted">{user.unit}</span>
          </div>
          <div className="text-xs text-muted">heaviest</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-center gap-1 text-xl font-bold">
            <Trophy size={16} className="text-brand" />
            {pr ? e1rm(pr) : 0}
          </div>
          <div className="text-xs text-muted">best est. 1RM</div>
        </div>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="font-semibold">Progress</h2>
        <p className="mb-4 text-xs text-muted">Heaviest set (orange) and estimated 1RM (dashed) per session</p>
        {chart.length >= 2 ? (
          <ProgressChart data={chart} unit={user.unit} />
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            Log this exercise in at least two workouts to see your progress chart.
          </p>
        )}
      </section>

      {history.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="mb-3 font-semibold">History</h2>
          <ul className="divide-y divide-line">
            {[...history].reverse().map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/history/${h.id}`} className="min-w-0 hover:text-brand">
                  <div className="truncate text-sm font-medium">{h.title}</div>
                  <div className="text-xs text-muted">{formatDate(h.date)}</div>
                </Link>
                <div className="text-right text-sm tabular-nums text-zinc-300">
                  {h.sets.map((s) => `${s.weight}×${s.reps}`).join("  ·  ")}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
