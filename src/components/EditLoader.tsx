"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/store";
import { workoutActions } from "@/store/workoutSlice";
import type { WorkoutDetail } from "@/lib/workouts";

/** Loads a saved workout into the Redux draft, then opens the logger in edit mode. */
export default function EditLoader({ workout }: { workout: WorkoutDetail }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(workoutActions.loadForEdit(workout));
    router.replace("/log");
  }, [dispatch, router, workout]);

  return <p className="py-20 text-center text-muted">Opening workout…</p>;
}
