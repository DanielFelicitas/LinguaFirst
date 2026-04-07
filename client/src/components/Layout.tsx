import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePageAnalytics } from "@/hooks/useAnalytics";
import { UserProfileMenu } from "@/components/UserProfileMenu";

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

const navActive = "bg-cyan-50 text-cyan-800 shadow-sm";

function linkActive(pathname: string, to: string, isActive: boolean): boolean {
  if (to === "/lessons") return pathname === "/lessons" || pathname.startsWith("/lessons/");
  return isActive;
}

const navItems: [string, string][] = [
  ["/", "Home"],
  ["/lessons", "Lessons"],
  ["/quiz", "Quiz"],
  ["/games", "Games"],
  ["/contact", "Contact"],
  ["/about", "About"],
];

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { pathname } = useLocation();
  const lessonsRoute = pathname.startsWith("/lessons");
  const homeRoute = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  usePageAnalytics();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={
        homeRoute
          ? {
              backgroundImage:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.62), rgba(213, 195, 195, 0.56)), url('/dist/main-background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              backgroundImage:
                "linear-gradient(to bottom, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.88))",
            }
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 10% -10%, rgba(186, 230, 253, 0.45), transparent), radial-gradient(ellipse 70% 50% at 90% 0%, rgba(204, 251, 241, 0.38), transparent), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(226, 232, 240, 0.4), transparent)",
        }}
      />
      {/* z-30 so the profile dropdown (overflowing below the header) stacks above <main z-10> */}
      <header className="relative z-30 border-b border-slate-200/80 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="group flex min-w-0 shrink items-baseline gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span
              className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl md:text-3xl"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Lingua<span className="text-cyan-600">FiRST</span>
            </span>
            <span className="hidden text-sm font-semibold text-slate-500 lg:inline">
              Bikol ↔ English
            </span>
          </Link>

          <nav
            className="hidden flex-wrap items-center gap-1 md:flex md:gap-2"
            aria-label="Main"
          >
            {navItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${navLink} ${linkActive(pathname, to, isActive) ? navActive : ""}`}
                end={to === "/"}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            {!loading && user ? (
              <UserProfileMenu user={user} onLogout={logout} />
            ) : !loading ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-slate-200 via-cyan-100 to-teal-100 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md shadow-slate-300/40 hover:brightness-[1.02]"
                >
                  Join
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-main-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="mobile-main-menu"
            className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col border-l border-slate-200/90 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/90 px-4 py-4">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Back</span>
              </button>
              <h2 id="mobile-menu-title" className="text-base font-semibold text-slate-900">
                Menu
              </h2>
              <span className="w-16" aria-hidden />
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
              <ul className="space-y-1">
                {navItems.map(([to, label]) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      className={({ isActive }) =>
                        `flex min-h-12 items-center rounded-xl px-4 text-base font-medium transition ${
                          linkActive(pathname, to, isActive)
                            ? "bg-cyan-50 text-cyan-900"
                            : "text-slate-800 hover:bg-slate-100"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {!loading && !user ? (
              <div className="border-t border-slate-200/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-slate-200 via-cyan-100 to-teal-100 text-base font-semibold text-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Join
                  </Link>
                </div>
              </div>
            ) : null}

            {!loading && user ? (
              <div className="border-t border-slate-200/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <p className="mb-3 truncate px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Signed in
                </p>
                <div className="flex flex-col gap-1">
                  <Link
                    to="/dashboard"
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Progress & notes
                  </Link>
                  {user.role === "admin" ? (
                    <>
                      <Link
                        to="/admin/content"
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Manage content
                      </Link>
                      <Link
                        to="/admin/essay-submissions"
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Essay submissions
                      </Link>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="mt-1 flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <main
        className={
          lessonsRoute
            ? "relative z-10 flex min-h-0 w-full max-w-none flex-1 flex-col px-0 py-8 pb-10 sm:py-10 sm:pb-12"
            : "relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-10 pb-12 sm:px-6 sm:pb-14"
        }
      >
        <Outlet />
      </main>

      <footer className="relative z-0 mt-auto shrink-0 border-t border-slate-200/80 bg-white/85 py-6 text-center text-sm text-slate-500 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-6">
          <p>© {new Date().getFullYear()} LinguaFiRST · Learn Bikol and English together.</p>
        </div>
      </footer>
    </div>
  );
}
