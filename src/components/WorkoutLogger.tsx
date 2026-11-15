"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Clock, Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { workoutActions as A } from "@/store/workoutSlice";
import ExercisePicker from "./ExercisePicker";

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return startedAt ? Math.max(0, now - startedAt) : 0;
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function WorkoutLogger({ unit }: { unit: string }) {
  const draft = useAppSelector((s) => s.workout);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const elapsed = useElapsed(draft.startedAt);

  const doneSets = draft.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalVolume = draft.exercises.reduce(
    (v, e) => v + e.sets.reduce((sv, s) => sv + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0),
    0,
  );

  if (!draft.active) {
    return (
      <div className="card mx-auto mt-4 flex max-w-md flex-col items-center px-6 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-black">
          <Dumbbell size={28} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Ready to train?</h1>
        <p className="mt-1 text-sm text-muted">Start a workout, add exercises, and log each set as you go.</p>
        <button className="btn-primary mt-6 px-6 py-3 text-base" onClick={() => dispatch(A.startWorkout())}>
          <Plus size={18} /> Start empty workout
        </button>
      </div>
    );
  }

  async function save() {
    setError("");
    const exercises = draft.exercises
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets
          .filter((s) => s.reps !== "" && Number(s.reps) > 0)
          .map((s) => ({ reps: Math.round(Number(s.reps)), weight: Number(s.weight) || 0 })),
      }))
      .filter((e) => e.sets.length > 0);

    if (exercises.length === 0) return setError("Log at least one set with reps before saving.");

    const durationMin = draft.editingId
      ? draft.durationMin ?? 0
      : Math.max(1, Math.round(elapsed / 60000));

    setSaving(true);
    try {
      const res = await fetch(draft.editingId ? `/api/workouts/${draft.editingId}` : "/api/workouts", {
        method: draft.editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title, notes: draft.notes, date: draft.date, durationMin, exercises }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save workout");
      const id = draft.editingId ?? data.id;
      dispatch(A.discardWorkout());
      router.push(`/history/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save workout");
      setSaving(false);
    }
  }

  function discard() {
    const msg = draft.editingId ? "Discard your changes to this workout?" : "Discard this workout? Nothing will be saved.";
    if (window.confirm(msg)) {
      const editing = draft.editingId;
      dispatch(A.discardWorkout());
      if (editing) router.push(`/history/${editing}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="card mb-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <input
            value={draft.title}
            onChange={(e) => dispatch(A.setTitle(e.target.value))}
            className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-zinc-600"
            placeholder="Workout name"
            aria-label="Workout name"
          />
          {draft.editingId ? (
            <span className="chip shrink-0 border-brand/40 text-brand">Editing</span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 font-mono text-sm text-brand tabular-nums">
              <Clock size={14} /> {formatElapsed(elapsed)}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => dispatch(A.setDate(e.target.value))}
            className="input w-auto py-1.5"
            aria-label="Date"
          />
          {draft.editingId && (
            <label className="flex items-center gap-2 text-muted">
              <input
                type="number"
                min={0}
                value={draft.durationMin ?? 0}
                onChange={(e) => dispatch(A.setDuration(Number(e.target.value) || 0))}
                className="input w-20 py-1.5"
                aria-label="Duration in minutes"
              />
              min
            </label>
          )}
          <span className="ml-auto text-xs text-muted">
            {doneSets} sets done · {Math.round(totalVolume).toLocaleString("en-US")} {unit}
          </span>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {draft.exercises.map((ex, i) => (
          <section key={ex.key} className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-brand">{ex.name}</h3>
                <p className="text-xs text-muted">{ex.category}</p>
              </div>
              <div className="flex shrink-0 items-center text-muted">
                <button
                  className="rounded-lg p-1.5 hover:text-white disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => dispatch(A.moveExercise({ key: ex.key, dir: -1 }))}
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="rounded-lg p-1.5 hover:text-white disabled:opacity-30"
                  disabled={i === draft.exercises.length - 1}
                  onClick={() => dispatch(A.moveExercise({ key: ex.key, dir: 1 }))}
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  className="rounded-lg p-1.5 hover:text-red-400"
                  onClick={() => dispatch(A.removeExercise(ex.key))}
                  aria-label={`Remove ${ex.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
              <span>Set</span>
              <span>{unit}</span>
              <span>Reps</span>
              <span className="text-center">Done</span>
              <span />
            </div>
            <div className="mt-1 space-y-1.5">
              {ex.sets.map((s, si) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 rounded-xl px-1 py-1 ${
                    s.done ? "bg-green-500/10" : ""
                  }`}
                >
                  <span className="text-center text-sm font-semibold text-muted">{si + 1}</span>
                  <input
                    inputMode="decimal"
                    value={s.weight}
                    onChange={(e) =>
                      dispatch(A.updateSet({ exKey: ex.key, setId: s.id, field: "weight", value: e.target.value.replace(/[^0-9.]/g, "") }))
                    }
                    className="input py-2 text-center tabular-nums"
                    placeholder="0"
                    aria-label={`Set ${si + 1} weight`}
                  />
                  <input
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) =>
                      dispatch(A.updateSet({ exKey: ex.key, setId: s.id, field: "reps", value: e.target.value.replace(/[^0-9]/g, "") }))
                    }
                    className="input py-2 text-center tabular-nums"
                    placeholder="0"
                    aria-label={`Set ${si + 1} reps`}
                  />
                  <button
                    onClick={() => dispatch(A.toggleSetDone({ exKey: ex.key, setId: s.id }))}
                    className={`mx-auto grid h-8 w-8 place-items-center rounded-lg border ${
                      s.done ? "border-green-500 bg-green-500 text-black" : "border-line text-muted hover:border-zinc-500"
                    }`}
                    aria-label={`Mark set ${si + 1} done`}
                    aria-pressed={s.done}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => dispatch(A.removeSet({ exKey: ex.key, setId: s.id }))}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-red-400"
                    aria-label={`Delete set ${si + 1}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => dispatch(A.addSet(ex.key))} className="btn-ghost mt-3 w-full py-2">
              <Plus size={15} /> Add set
            </button>
          </section>
        ))}
      </div>

      <button onClick={() => setPicking(true)} className="btn mt-4 w-full border border-dashed border-brand/50 py-3 text-brand hover:bg-brand/10">
        <Plus size={18} /> Add exercise
      </button>

      <div className="mt-4">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={draft.notes}
          onChange={(e) => dispatch(A.setNotes(e.target.value))}
          className="input min-h-20"
          placeholder="How did it feel? Anything to remember next time?"
        />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button onClick={discard} className="btn-danger flex-1">
          {draft.editingId ? "Cancel" : "Discard"}
        </button>
        <button onClick={save} className="btn-primary flex-[2]" disabled={saving}>
          {saving ? "Saving…" : draft.editingId ? "Save changes" : "Finish workout"}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(e) => {
            dispatch(A.addExercise(e));
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
