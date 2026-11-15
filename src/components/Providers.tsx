"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, persistDraft } from "@/store/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  useEffect(() => persistDraft(store), [store]);
  return <Provider store={store}>{children}</Provider>;
}
