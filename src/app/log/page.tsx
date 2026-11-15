import { requireUser } from "@/lib/auth";
import WorkoutLogger from "@/components/WorkoutLogger";

export const metadata = { title: "Log workout" };

export default async function LogPage() {
  const user = await requireUser();
  return <WorkoutLogger unit={user.unit} />;
}
