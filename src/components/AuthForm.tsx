"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dumbbell } from "lucide-react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-sm sm:mt-14">
      <div className="mb-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand text-black">
          <Dumbbell size={24} strokeWidth={2.5} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup ? "Start logging your workouts in under a minute." : "Log in to keep tracking your lifts."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        {isSignup && (
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" name="name" className="input" placeholder="Alex Lifter" required autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>
        {error && <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to Liftlog? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-brand hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
