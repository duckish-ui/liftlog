"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export type PickedExercise = { id: string; name: string; category: string };
type Result = PickedExercise & { muscles: string[]; equipment: string[]; custom: boolean };

export default function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (e: PickedExercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, category, limit: "40" });
        const res = await fetch(`/api/exercises?${params}`, { signal: ctrl.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, category]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function createCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      category: String(form.get("category") ?? "Other"),
      muscles: String(form.get("muscles") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      equipment: [],
      description: "",
    };
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not create exercise");
    onPick({ id: data.id, name: data.name, category: data.category });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-panel sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add exercise"
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-semibold">{creating ? "New custom exercise" : "Add exercise"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {creating ? (
          <form onSubmit={createCustom} className="space-y-4 p-4">
            <div>
              <label className="label" htmlFor="cx-name">Name</label>
              <input id="cx-name" name="name" className="input" placeholder="e.g. Landmine Press" required defaultValue={q} />
            </div>
            <div>
              <label className="label" htmlFor="cx-cat">Category</label>
              <select id="cx-cat" name="category" className="input" defaultValue={category || "Chest"}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cx-mus">Muscles (comma separated)</label>
              <input id="cx-mus" name="muscles" className="input" placeholder="Chest, Triceps" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setCreating(false)}>
                Back
              </button>
              <button className="btn-primary flex-1">Create &amp; add</button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-3 p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input pl-9"
                  placeholder="Search 800+ exercises…"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["", ...CATEGORIES].map((c) => (
                  <button
                    key={c || "all"}
                    onClick={() => setCategory(c)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      category === c ? "bg-brand text-black" : "bg-panel-2 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {c || "All"}
                  </button>
                ))}
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto px-2 pb-2">
              {loading && results.length === 0 && <li className="p-4 text-center text-sm text-muted">Loading…</li>}
              {!loading && results.length === 0 && (
                <li className="p-4 text-center text-sm text-muted">No exercises match “{q}”.</li>
              )}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => onPick(r)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-panel-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {r.name} {r.custom && <span className="chip ml-1 text-[10px]">custom</span>}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {r.category}
                        {r.muscles.length > 0 && ` · ${r.muscles.slice(0, 3).join(", ")}`}
                      </div>
                    </div>
                    <Plus size={16} className="shrink-0 text-brand" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-line p-3">
              <button onClick={() => setCreating(true)} className="btn-ghost w-full">
                <Plus size={16} /> Create custom exercise
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
