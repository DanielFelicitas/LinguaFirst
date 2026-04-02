import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { UserOut } from "@/lib/api";

function initials(user: UserOut): string {
  const n = user.displayName?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  const e = user.email;
  return e.length >= 2 ? e.slice(0, 2).toUpperCase() : e.toUpperCase();
}

type Props = {
  user: UserOut;
  onLogout: () => void;
};

export function UserProfileMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Use click so the same gesture completes on menu items (mousedown vs stacking quirks)
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const primary = user.displayName?.trim() || user.email;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-rose-100 to-teal-100 text-xs font-semibold text-slate-700 shadow-sm ring-teal-400/40 transition hover:brightness-[1.03] focus:outline-none focus:ring-2"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
      >
        {initials(user)}
      </button>

      {open ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-200/90 bg-white/95 py-2 shadow-lg shadow-slate-200/80 backdrop-blur-md"
        >
          <div className="border-b border-slate-100 px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold text-slate-900">{primary}</p>
            {user.displayName?.trim() ? (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={
                  user.role === "admin"
                    ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                    : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                }
              >
                {user.role === "admin" ? "Admin" : "Learner"}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              to="/dashboard"
              role="menuitem"
              onClick={close}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-900"
            >
              Progress & notes
            </Link>
            {user.role === "admin" ? (
              <Link
                to="/admin/content"
                role="menuitem"
                onClick={close}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900"
              >
                Manage content
              </Link>
            ) : null}
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
