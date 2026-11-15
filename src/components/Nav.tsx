"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, History, LayoutDashboard, ListChecks, LogOut, Plus } from "lucide-react";
import { useAppSelector } from "@/store/store";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Log", icon: Plus },
  { href: "/history", label: "History", icon: History },
  { href: "/exercises", label: "Exercises", icon: ListChecks },
];

export default function Nav({ userName }: { userName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = useAppSelector((s) => s.workout.active);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={userName ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-black">
              <Dumbbell size={18} strokeWidth={2.5} />
            </span>
            Liftlog
          </Link>

          {userName ? (
            <div className="flex items-center gap-1">
              <nav className="hidden items-center gap-1 sm:flex">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive(href) ? "bg-panel-2 text-white" : "text-muted hover:text-white"
                    }`}
                  >
                    {label}
                    {href === "/log" && active && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" aria-label="workout in progress" />
                    )}
                  </Link>
                ))}
              </nav>
              <span className="ml-3 hidden text-sm text-muted md:inline">Hi, {userName.split(" ")[0]}</span>
              <button onClick={logout} className="ml-2 rounded-lg p-2 text-muted hover:text-white" title="Log out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost py-1.5!">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary py-1.5!">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {userName && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 backdrop-blur sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive(href) ? "text-brand" : "text-muted"
                }`}
              >
                <Icon size={20} />
                {label}
                {href === "/log" && active && <span className="absolute right-6 top-2 h-2 w-2 rounded-full bg-brand" />}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
