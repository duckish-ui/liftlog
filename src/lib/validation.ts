import { z } from "zod";
import { NextResponse } from "next/server";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const customExerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.string().trim().min(1).max(40),
  muscles: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  equipment: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  description: z.string().trim().max(2000).default(""),
});

const setSchema = z.object({
  reps: z.number().int().min(0).max(1000),
  weight: z.number().min(0).max(5000),
});

export const workoutSchema = z.object({
  title: z.string().trim().min(1, "Give your workout a name").max(80),
  notes: z.string().trim().max(2000).default(""),
  date: z.coerce.date(),
  durationMin: z.number().int().min(0).max(1440).default(0),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        sets: z.array(setSchema).min(1, "Each exercise needs at least one set").max(50),
      }),
    )
    .min(1, "Add at least one exercise")
    .max(40),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;

export async function parseBody<T>(req: Request, schema: z.ZodType<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) } as const;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? "Invalid input";
    return { error: NextResponse.json({ error: msg }, { status: 400 }) } as const;
  }
  return { data: result.data } as const;
}
