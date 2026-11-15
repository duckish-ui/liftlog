import Link from "next/link";
import { ChevronRight, Clock, History, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate, formatNumber, volume } from "@/lib/stats";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await requireUser();
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      sets: {
        orderBy: [{ order: "asc" }, { setNumber: "asc" }],
        select: { reps: true, weight: true, order: true, exercise: { select: { name: true } } },
      },
    },
  });

  // Group by month for a nicer timeline.
  const months = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = formatDate(w.date, { month: "long", year: "numeric" });
    months.set(key, [...(months.get(key) ?? []), w]);
  }

  return (
    <div>
      <PageHeader
        title="History"
        subtitle={`${workouts.length} workout${workouts.length === 1 ? "" : "s"} logged`}
        action={
          <Link href="/log" className="btn-primary">
            <Plus size={16} /> Log workout
          </Link>
        }
      />

      {workouts.length === 0 ? (
        <EmptyState icon={History} title="No workouts yet" body="Everything you log shows up here." href="/log" cta="Log a workout" />
      ) : (
        <div className="space-y-8">
          {[...months.entries()].map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{month}</h2>
              <ul className="space-y-3">
                {list.map((w) => {
                  const names = [...new Set(w.sets.map((s) => s.exercise.name))];
                  return (
                    <li key={w.id}>
                      <Link href={`/history/${w.id}`} className="card group flex items-center gap-4 p-4 hover:border-brand/50">
                        <div className="grid w-12 shrink-0 place-items-center rounded-xl bg-panel-2 py-2 text-center">
                          <span className="text-[10px] font-semibold uppercase text-brand">
                            {formatDate(w.date, { weekday: "short" })}
                          </span>
                          <span className="text-lg font-bold leading-tight">{formatDate(w.date, { day: "numeric" })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold group-hover:text-brand">{w.title}</div>
                          <div className="truncate text-sm text-muted">{names.join(" · ")}</div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {w.durationMin} min
                            </span>
                            <span>{w.sets.length} sets</span>
                            <span>
                              {formatNumber(volume(w.sets))} {user.unit}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
