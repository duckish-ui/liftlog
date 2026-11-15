import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Pencil, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getWorkoutDetail } from "@/lib/workouts";
import { e1rm, formatDate, formatNumber, volume } from "@/lib/stats";
import DeleteWorkoutButton from "@/components/DeleteWorkoutButton";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const w = await getWorkoutDetail(user.id, id);
  if (!w) notFound();

  const allSets = w.exercises.flatMap((e) => e.sets);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/history" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> History
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{w.title}</h1>
            <p className="mt-1 text-sm text-muted">{formatDate(w.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/history/${w.id}/edit`} className="btn-ghost py-2">
              <Pencil size={15} /> Edit
            </Link>
            <DeleteWorkoutButton id={w.id} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-panel-2 p-3">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              <Clock size={16} className="text-brand" /> {w.durationMin}
            </div>
            <div className="text-xs text-muted">minutes</div>
          </div>
          <div className="rounded-xl bg-panel-2 p-3">
            <div className="text-lg font-bold">{allSets.length}</div>
            <div className="text-xs text-muted">sets</div>
          </div>
          <div className="rounded-xl bg-panel-2 p-3">
            <div className="text-lg font-bold">{formatNumber(volume(allSets))}</div>
            <div className="text-xs text-muted">{user.unit} volume</div>
          </div>
        </div>
        {w.notes && <p className="mt-4 whitespace-pre-wrap rounded-xl border border-line p-3 text-sm text-zinc-300">{w.notes}</p>}
      </div>

      <div className="mt-4 space-y-4">
        {w.exercises.map((g, i) => {
          const best = g.sets.reduce((a, b) => (e1rm(b) > e1rm(a) ? b : a), g.sets[0]);
          return (
            <section key={i} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <Link href={`/exercises/${g.exercise.id}`} className="font-semibold text-brand hover:underline">
                  {g.exercise.name}
                </Link>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Trophy size={12} /> Best: {best.weight} × {best.reps}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="w-12 pb-1 font-medium">Set</th>
                    <th className="pb-1 font-medium">Weight</th>
                    <th className="pb-1 font-medium">Reps</th>
                    <th className="pb-1 text-right font-medium">Est. 1RM</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {g.sets.map((s, si) => (
                    <tr key={si} className="border-t border-line">
                      <td className="py-2 text-muted">{si + 1}</td>
                      <td className="py-2">
                        {s.weight} {user.unit}
                      </td>
                      <td className="py-2">{s.reps}</td>
                      <td className="py-2 text-right text-muted">{e1rm(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}
