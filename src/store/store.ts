import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import workoutReducer, { emptyDraft, workoutActions, type WorkoutDraft } from "./workoutSlice";

const STORAGE_KEY = "liftlog.draft";

export function makeStore() {
  return configureStore({ reducer: { workout: workoutReducer } });
}

/**
 * Restore the in-progress workout from localStorage, then keep saving it,
 * so a page reload at the gym never loses your session. Runs after mount
 * so server and client render the same HTML first.
 */
export function persistDraft(store: AppStore) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) store.dispatch(workoutActions.hydrate({ ...emptyDraft, ...(JSON.parse(raw) as Partial<WorkoutDraft>) }));
  } catch {
    /* storage unavailable or corrupt */
  }
  return store.subscribe(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().workout));
    } catch {
      /* storage unavailable */
    }
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
