import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Dumbbell, Flame, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth";

const features = [
  { icon: Dumbbell, title: "Log in seconds", body: "Add exercises, punch in weight × reps, tick sets off as you go." },
  { icon: Trophy, title: "Personal records", body: "Your heaviest sets and estimated 1-rep maxes, tracked automatically." },
  { icon: BarChart3, title: "See progress", body: "Weekly volume and per-exercise charts show if you're getting stronger." },
  { icon: Flame, title: "Build streaks", body: "Workouts this week and your current streak, front and center." },
];

export default async function Home() {
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="py-10 sm:py-16">
      <section className="mx-auto max-w-2xl text-center">
        <span className="chip mb-5 border-brand/40 text-brand">Simple workout tracker</span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Lift. Log. <span className="text-brand">Progress.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted">
          Liftlog is the no-clutter way to track your gym sessions and actually see yourself getting stronger.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Start tracking free
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>

      <p className="mt-12 text-center text-xs text-muted">
        Exercise data from the open-source{" "}
        <a href="https://wger.de" className="underline hover:text-white" target="_blank" rel="noreferrer">
          wger Workout Manager
        </a>{" "}
        API.
      </p>
    </div>
  );
}
