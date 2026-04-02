import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1
        className="text-3xl font-semibold text-slate-800"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        Sign in
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        No account?{" "}
        <Link to="/register" className="text-teal-600 hover:underline">
          Create one
        </Link>
      </p>
      <form onSubmit={onSubmit} className="glass mt-8 space-y-4 rounded-2xl p-6">
        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </div>
        ) : null}
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-200/0 transition focus:ring-2 focus:ring-teal-300"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-teal-300"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 py-2.5 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
