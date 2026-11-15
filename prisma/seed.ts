/**
 * Seed script:
 *  1. Imports the English exercise catalogue from the wger API into the Exercise table.
 *  2. Creates a demo account with ~8 weeks of realistic workout history.
 *
 * Run: npm run db:seed   (safe to re-run; it upserts exercises and rebuilds the demo user)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fetchAllWgerExercises } from "../src/lib/wger";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@liftlog.app";
const DEMO_PASSWORD = "liftlog123";

async function importExercises() {
  console.log("Fetching exercises from wger…");
  const list = await fetchAllWgerExercises();
  // wger has a few duplicate names; keep the first of each.
  const seen = new Set<string>();
  const unique = list.filter((e) => {
    const k = e.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`Upserting ${unique.length} exercises…`);
  const BATCH = 50;
  for (let i = 0; i < unique.length; i += BATCH) {
    await prisma.$transaction(
      unique.slice(i, i + BATCH).map((e) =>
        prisma.exercise.upsert({
          where: { wgerId: e.wgerId },
          update: { name: e.name, category: e.category, muscles: e.muscles, equipment: e.equipment, description: e.description },
          create: {
            wgerId: e.wgerId,
            name: e.name,
            category: e.category,
            muscles: e.muscles,
            equipment: e.equipment,
            description: e.description,
          },
        }),
      ),
    );
  }
}

/** Find a library exercise by (case-insensitive) name, trying a few spellings. */
async function find(...names: string[]) {
  for (const name of names) {
    const ex = await prisma.exercise.findFirst({
      where: { userId: null, name: { equals: name, mode: "insensitive" } },
    });
    if (ex) return ex;
  }
  for (const name of names) {
    const ex = await prisma.exercise.findFirst({
      where: { userId: null, name: { contains: name, mode: "insensitive" } },
      orderBy: { name: "asc" },
    });
    if (ex) return ex;
  }
  throw new Error(`Exercise not found: ${names.join(" / ")}`);
}

async function seedDemo() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: "Demo Lifter", passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) },
  });

  const bench = await find("Bench Press", "Barbell Bench Press");
  const incline = await find("Incline Dumbbell Press", "Incline Bench Press");
  const ohp = await find("Overhead Press", "Shoulder Press");
  const squat = await find("Squats", "Barbell Squat", "Squat");
  const deadlift = await find("Deadlifts", "Deadlift");
  const row = await find("Bent Over Rowing", "Barbell Row", "Bent Over Row");
  const pullup = await find("Pull-ups", "Pull Ups", "Pull-up");
  const curl = await find("Biceps Curls With Barbell", "Barbell Curl", "Bicep Curl");
  const legPress = await find("Leg Press");
  const lateral = await find("Lateral Raises", "Lateral Raise");

  // Push / Pull / Legs rotation, 3–4 days a week, with steady progression.
  const plans = [
    { title: "Push Day", items: [[bench, 135, 8, 5], [incline, 45, 10, 2.5], [ohp, 85, 8, 2.5], [lateral, 15, 12, 0.5]] },
    { title: "Pull Day", items: [[deadlift, 185, 5, 10], [row, 115, 8, 5], [pullup, 0, 8, 0], [curl, 55, 10, 2.5]] },
    { title: "Leg Day", items: [[squat, 155, 6, 7.5], [legPress, 230, 10, 10]] },
  ] as const;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const offsets: number[] = [];
  // Days ago for each workout over ~8 weeks (Mon/Wed/Fri/Sat-ish), newest first ends yesterday/today.
  for (let week = 7; week >= 0; week--) {
    for (const d of week % 2 ? [6, 4, 2] : [6, 4, 2, 1]) offsets.push(week * 7 + d - 1);
  }
  offsets.push(0);

  let session = 0;
  for (const daysAgo of offsets) {
    const plan = plans[session % plans.length];
    const round = Math.floor(session / plans.length); // progression step
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - daysAgo);

    const sets = plan.items.flatMap(([ex, base, reps, step], order) =>
      Array.from({ length: order === 0 ? 4 : 3 }, (_, i) => {
        const weight = base + step * round;
        return {
          exerciseId: ex.id,
          order,
          setNumber: i + 1,
          reps: Math.max(1, reps - (i === 3 ? 2 : 0) - (round % 3 === 2 && i > 1 ? 1 : 0)),
          weight: Math.round(weight / 2.5) * 2.5,
        };
      }),
    );

    await prisma.workout.create({
      data: {
        userId: user.id,
        title: plan.title,
        date,
        durationMin: 45 + ((session * 7) % 25),
        notes: session % 5 === 0 ? "Felt strong today." : "",
        sets: { create: sets },
      },
    });
    session++;
  }
  console.log(`Demo user ${DEMO_EMAIL} with ${session} workouts created.`);
}

async function main() {
  await importExercises();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
