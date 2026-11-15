import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type DraftSet = { id: string; reps: string; weight: string; done: boolean };
export type DraftExercise = { key: string; exerciseId: string; name: string; category: string; sets: DraftSet[] };

export type WorkoutDraft = {
  active: boolean;
  editingId: string | null; // set when editing an existing workout
  title: string;
  notes: string;
  date: string; // yyyy-mm-dd
  startedAt: number | null; // ms timestamp, for the timer/duration
  durationMin: number | null; // fixed duration when editing
  exercises: DraftExercise[];
};

/** The user's local calendar date as yyyy-mm-dd. */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const emptyDraft: WorkoutDraft = {
  active: false,
  editingId: null,
  title: "",
  notes: "",
  date: today(),
  startedAt: null,
  durationMin: null,
  exercises: [],
};

const newSet = (prev?: DraftSet): DraftSet => ({
  id: nanoid(),
  reps: prev?.reps ?? "",
  weight: prev?.weight ?? "",
  done: false,
});

function defaultTitle() {
  const h = new Date().getHours();
  const part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `${part} Workout`;
}

const workoutSlice = createSlice({
  name: "workout",
  initialState: emptyDraft,
  reducers: {
    hydrate(_state, action: PayloadAction<WorkoutDraft>) {
      return action.payload;
    },
    startWorkout(state) {
      if (state.active) return;
      Object.assign(state, emptyDraft, { active: true, title: defaultTitle(), date: today(), startedAt: Date.now() });
    },
    loadForEdit(
      _state,
      action: PayloadAction<{
        id: string;
        title: string;
        notes: string;
        date: string;
        durationMin: number;
        exercises: { exercise: { id: string; name: string; category: string }; sets: { reps: number; weight: number }[] }[];
      }>,
    ) {
      const w = action.payload;
      return {
        active: true,
        editingId: w.id,
        title: w.title,
        notes: w.notes,
        date: w.date.slice(0, 10),
        startedAt: null,
        durationMin: w.durationMin,
        exercises: w.exercises.map((g) => ({
          key: nanoid(),
          exerciseId: g.exercise.id,
          name: g.exercise.name,
          category: g.exercise.category,
          sets: g.sets.map((s) => ({ id: nanoid(), reps: String(s.reps), weight: String(s.weight), done: true })),
        })),
      };
    },
    discardWorkout() {
      return { ...emptyDraft, date: today() };
    },
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    setNotes(state, action: PayloadAction<string>) {
      state.notes = action.payload;
    },
    setDate(state, action: PayloadAction<string>) {
      state.date = action.payload;
    },
    setDuration(state, action: PayloadAction<number | null>) {
      state.durationMin = action.payload;
    },
    addExercise(state, action: PayloadAction<{ id: string; name: string; category: string }>) {
      const e = action.payload;
      state.exercises.push({ key: nanoid(), exerciseId: e.id, name: e.name, category: e.category, sets: [newSet()] });
    },
    removeExercise(state, action: PayloadAction<string>) {
      state.exercises = state.exercises.filter((e) => e.key !== action.payload);
    },
    moveExercise(state, action: PayloadAction<{ key: string; dir: -1 | 1 }>) {
      const i = state.exercises.findIndex((e) => e.key === action.payload.key);
      const j = i + action.payload.dir;
      if (i < 0 || j < 0 || j >= state.exercises.length) return;
      [state.exercises[i], state.exercises[j]] = [state.exercises[j], state.exercises[i]];
    },
    addSet(state, action: PayloadAction<string>) {
      const ex = state.exercises.find((e) => e.key === action.payload);
      if (ex) ex.sets.push(newSet(ex.sets[ex.sets.length - 1]));
    },
    removeSet(state, action: PayloadAction<{ exKey: string; setId: string }>) {
      const ex = state.exercises.find((e) => e.key === action.payload.exKey);
      if (ex) ex.sets = ex.sets.filter((s) => s.id !== action.payload.setId);
    },
    updateSet(
      state,
      action: PayloadAction<{ exKey: string; setId: string; field: "reps" | "weight"; value: string }>,
    ) {
      const { exKey, setId, field, value } = action.payload;
      const set = state.exercises.find((e) => e.key === exKey)?.sets.find((s) => s.id === setId);
      if (set) set[field] = value;
    },
    toggleSetDone(state, action: PayloadAction<{ exKey: string; setId: string }>) {
      const set = state.exercises
        .find((e) => e.key === action.payload.exKey)
        ?.sets.find((s) => s.id === action.payload.setId);
      if (set) set.done = !set.done;
    },
  },
});

export const workoutActions = workoutSlice.actions;
export default workoutSlice.reducer;
