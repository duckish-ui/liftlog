import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Exercises" };

const PAGE_SIZE = 24;

type SP = Promise<{ q?: string; category?: string; page?: string; mine?: string }>;

export default async function ExercisesPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = CATEGORIES.includes(sp.category as (typeof CATEGORIES)[number]) ? sp.category! : "";
  const mine = sp.mine === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ExerciseWhereInput = {
    AND: [
      { OR: [{ userId: null }, { userId: user.id }] },
      q ? { name: { contains: q, mode: "insensitive" } } : {},
      category ? { category } : {},
      // "Trained" filter: only exercises you've logged at least once.
      mine ? { sets: { some: { workout: { userId: user.id } } } } : {},
    ],
  };

  const [total, exercises] = await Promise.all([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        category: true,
        muscles: true,
        equipment: true,
        userId: true,
        _count: { select: { sets: { where: { workout: { userId: user.id } } } } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const next = { q, category, mine: mine ? "1" : "", page: 1, ...patch };
    for (const [k, v] of Object.entries(next)) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/exercises${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Exercises" subtitle={`${total.toLocaleString("en-US")} exercises · library from the wger API`} />

      <form className="relative mb-3" action="/exercises">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} className="input pl-9" placeholder="Search exercises…" />
        {category && <input type="hidden" name="category" value={category} />}
        {mine && <input type="hidden" name="mine" value="1" />}
      </form>

      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto pb-1">
        <Link
          href={href({ mine: mine ? "" : "1" })}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${mine ? "bg-white text-black" : "bg-panel-2 text-zinc-300 hover:text-white"}`}
        >
          ★ Trained
        </Link>
        <span className="mx-1 w-px shrink-0 bg-line" />
        {["", ...CATEGORIES].map((c) => (
          <Link
            key={c || "all"}
            href={href({ category: c })}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              category === c ? "bg-brand text-black" : "bg-panel-2 text-zinc-300 hover:text-white"
            }`}
          >
            {c || "All"}
          </Link>
        ))}
      </div>

      {exercises.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">No exercises found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((e) => (
            <Link key={e.id} href={`/exercises/${e.id}`} className="card group p-4 hover:border-brand/50">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug group-hover:text-brand">{e.name}</h3>
                {e._count.sets > 0 && (
                  <span className="chip shrink-0 border-brand/40 text-brand">{e._count.sets} sets</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip">{e.category}</span>
                {e.userId && <span className="chip">custom</span>}
                {e.muscles.filter((m) => m !== e.category).slice(0, 2).map((m) => (
                  <span key={m} className="chip text-muted">
                    {m}
                  </span>
                ))}
              </div>
              {e.equipment.length > 0 && <p className="mt-2 truncate text-xs text-muted">{e.equipment.join(", ")}</p>}
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="btn-ghost py-2">
              <ChevronLeft size={16} /> Prev
            </Link>
          ) : (
            <span className="btn-ghost py-2 opacity-40">
              <ChevronLeft size={16} /> Prev
            </span>
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="btn-ghost py-2">
              Next <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="btn-ghost py-2 opacity-40">
              Next <ChevronRight size={16} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
