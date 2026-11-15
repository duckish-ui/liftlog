import Link from "next/link";
import { CalendarCheck, ChevronRight, Dumbbell, Flame, Plus, Trophy, Weight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { currentStreak, e1rm, formatDate, formatNumber, startOfWeek, volume } from "@/lib/stats";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { VolumeChart } from "@/components/Charts";

export const metadata = { title: "Dashboard" };

const WEEKS = 8;

export default async function DashboardPage() {
  const user = await requireUser();
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { sets: { include: { exercise: { select: { id: true, name: true } } } } },
  });

  const thisWeek = startOfWeek(new Date());
  const weekCount = workouts.filter((w) => w.date >= thisWeek).length;
  const streak = currentStreak(workouts.map((w) => w.date));
  const allSets = workouts.flatMap((w) => w.sets);
  const totalVolume = volume(allSets);

  // Weekly volume for the last 8 weeks (oldest → newest).
  const weekly = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - 7 * (WEEKS - 1 - i));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const v = volume(workouts.filter((w) => w.date >= start && w.date < end).flatMap((w) => w.sets));
    return { label: formatDate(start, { month: "short", day: "numeric" }), volume: Math.round(v) };
  });

  // Personal records: best estimated 1RM per exercise, top 6 by how often you train it.
  const byExercise = new Map<string, { id: string; name: string; count: number; best: { reps: number; weight: number }; bestE1rm: number }>();
  for (const s of allSets) {
    const cur = byExercise.get(s.exercise.id);
    const est = e1rm(s);
    if (!cur) {
      byExercise.set(s.exercise.id, { id: s.exercise.id, name: s.exercise.name, count: 1, best: s, bestE1rm: est });
    } else {
      cur.count++;
      if (est > cur.bestE1rm) {
        cur.best = s;
        cur.bestE1rm = est;
      }
    }
  }
  const prs = [...byExercise.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Hey ${firstName} 👋`}
        subtitle={weekCount > 0 ? `${weekCount} workout${weekCount === 1 ? "" : "s"} this week. Keep it up.` : "No workouts yet this week. Let's change that."}
        action={
          <Link href="/log" className="btn-primary">
            <Plus size={16} /> Log workout
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="This week" value={String(weekCount)} hint="workouts" />
        <StatCard icon={Flame} label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} hint="in a row" />
        <StatCard icon={Dumbbell} label="Workouts" value={String(workouts.length)} hint="all time" />
        <StatCard icon={Weight} label="Volume" value={formatNumber(totalVolume)} hint={`${user.unit} lifted all time`} />
      </div>

      {workouts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Dumbbell}
            title="Log your first workout"
            body="Add a few exercises and sets. Your stats, charts and PRs will show up here."
            href="/log"
            cta="Start a workout"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-3">
            <h2 className="font-semibold">Weekly volume</h2>
            <p className="mb-4 text-xs text-muted">Total weight × reps per week ({user.unit})</p>
            <VolumeChart data={weekly} unit={user.unit} />
          </section>

          <section className="card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent workouts</h2>
              <Link href="/history" className="text-xs text-brand hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {workouts.slice(0, 5).map((w) => (
                <li key={w.id}>
                  <Link href={`/history/${w.id}`} className="group flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium group-hover:text-brand">{w.title}</div>
                      <div className="text-xs text-muted">
                        {formatDate(w.date, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                        {new Set(w.sets.map((s) => s.exercise.id)).size} exercises · {w.sets.length} sets
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5 lg:col-span-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-brand" />
              <h2 className="font-semibold">Personal records</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prs.map((p) => (
                <Link key={p.id} href={`/exercises/${p.id}`} className="rounded-xl border border-line bg-panel-2 p-4 hover:border-brand/60">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">
                    {p.best.weight} {user.unit} <span className="text-sm font-medium text-muted">× {p.best.reps}</span>
                  </div>
                  <div className="text-xs text-muted">Est. 1RM {p.bestE1rm} {user.unit}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
