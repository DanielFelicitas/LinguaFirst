import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePageAnalytics } from "@/hooks/useAnalytics";
import { UserProfileMenu } from "@/components/UserProfileMenu";

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-slate-900";

const navActive = "bg-teal-50 text-teal-800 shadow-sm";

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { pathname } = useLocation();
  const lessonsRoute = pathname.startsWith("/lessons");
  usePageAnalytics();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-rose-50/40 to-sky-50/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 10% -10%, rgba(251, 207, 232, 0.55), transparent), radial-gradient(ellipse 70% 50% at 90% 0%, rgba(204, 251, 241, 0.5), transparent), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(254, 243, 199, 0.35), transparent)",
        }}
      />
      {/* z-30 so the profile dropdown (overflowing below the header) stacks above <main z-10> */}
      <header className="relative z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="group flex items-baseline gap-2">
            <span
              className="text-2xl font-bold tracking-tight text-rose-600 sm:text-3xl"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Lingua<span className="text-teal-600">FiRST</span>
            </span>
            <span className="hidden text-sm font-semibold text-slate-500 sm:inline">Bikol ↔ English</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Main">
            {[
              ["/", "Home"],
              ["/lessons", "Lessons"],
              ["/quiz", "Quiz"],
              ["/games", "Games"],
              ["/contact", "Contact"],
              ["/about", "About"],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${navLink} ${isActive ? navActive : ""}`}
                end={to === "/"}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!loading && user ? (
              <UserProfileMenu user={user} onLogout={logout} />
            ) : !loading ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md shadow-rose-200/50 hover:brightness-[1.02]"
                >
                  Join
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={
          lessonsRoute
            ? "relative z-10 w-full max-w-none px-0 py-8 sm:py-10"
            : "relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6"
        }
      >
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/60 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} LinguaFiRST · Learn Bikol and English together.</p>
      </footer>
    </div>
  );
}
