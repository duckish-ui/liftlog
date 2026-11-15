"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteWorkoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this workout? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/history");
      router.refresh();
    } else {
      setBusy(false);
      window.alert("Could not delete the workout.");
    }
  }

  return (
    <button onClick={onDelete} disabled={busy} className="btn-danger py-2">
      <Trash2 size={15} /> {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
