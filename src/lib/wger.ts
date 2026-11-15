// Client for the free wger Workout Manager API (https://wger.de/api/v2/), no key required.
const BASE = "https://wger.de/api/v2";
const ENGLISH = 2;

type WgerNamed = { id: number; name: string; name_en?: string };
type WgerExerciseInfo = {
  id: number;
  category: WgerNamed;
  muscles: WgerNamed[];
  muscles_secondary: WgerNamed[];
  equipment: WgerNamed[];
  images: { image: string; is_main: boolean }[];
  translations: { language: number; name: string; description: string }[];
};

export type WgerExercise = {
  wgerId: number;
  name: string;
  category: string;
  muscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  description: string;
  image: string | null;
};

const muscleName = (m: WgerNamed) => (m.name_en && m.name_en.trim()) || m.name;

export function stripHtml(html: string) {
  return html
    .replace(/<\/(p|li|ol|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const clean = (s: string) => s.replace(/[​-‍﻿]/g, "").trim();

function normalize(info: WgerExerciseInfo): WgerExercise | null {
  const en = info.translations.find((t) => t.language === ENGLISH);
  if (!en || !en.name.trim()) return null;
  const main = info.images.find((i) => i.is_main) ?? info.images[0];
  return {
    wgerId: info.id,
    name: clean(en.name),
    category: info.category?.name ?? "Other",
    muscles: info.muscles.map(muscleName),
    secondaryMuscles: info.muscles_secondary.map(muscleName),
    equipment: info.equipment.map((e) => e.name),
    description: stripHtml(en.description ?? ""),
    image: main?.image ?? null,
  };
}

/** One exercise with full detail (cached for a day). */
export async function fetchWgerExercise(wgerId: number): Promise<WgerExercise | null> {
  try {
    const res = await fetch(`${BASE}/exerciseinfo/${wgerId}/`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return normalize((await res.json()) as WgerExerciseInfo);
  } catch {
    return null;
  }
}

/** Page through the whole English exercise catalogue (used by the seed/import). */
export async function fetchAllWgerExercises(max = 1000): Promise<WgerExercise[]> {
  const out: WgerExercise[] = [];
  let url: string | null = `${BASE}/exerciseinfo/?language=${ENGLISH}&limit=100`;
  while (url && out.length < max) {
    const res: Response = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`wger request failed: ${res.status}`);
    const data = (await res.json()) as { next: string | null; results: WgerExerciseInfo[] };
    for (const r of data.results) {
      const ex = normalize(r);
      if (ex) out.push(ex);
    }
    url = data.next;
  }
  return out;
}
