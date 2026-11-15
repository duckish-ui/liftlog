import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorkoutDetail } from "@/lib/workouts";
import EditLoader from "@/components/EditLoader";

export const metadata = { title: "Edit workout" };

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const workout = await getWorkoutDetail(user.id, id);
  if (!workout) notFound();
  return <EditLoader workout={workout} />;
}
