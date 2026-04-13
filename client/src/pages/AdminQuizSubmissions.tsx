import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, type QuizSubmissionSummaryOut } from "@/lib/api";

function typeLabel(type?: string) {
  if (type === "essay") return "Essay";
  if (type === "true_false") return "True / False";
  return "Multiple Choice";
}

export function AdminQuizSubmissions() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<QuizSubmissionSummaryOut[]>([]);
  const [pending, setPending] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    (async () => {
      setPending(true);
      setErr(null);
      try {
        const res = await api.admin.listQuizSubmissionSummaries();
        if (!cancelled) setItems(res.quizzes);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load quiz submissions");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/admin/essay-submissions" className="text-teal-600 hover:underline">
            ← Essay submissions
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          Quiz submissions
        </h1>
        <p className="mt-2 text-sm text-slate-600">Excel-style overview of scores grouped by quiz. Click a row to see all participants.</p>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}
      {pending ? <p className="text-sm text-slate-500">Loading submissions…</p> : null}

      {!pending && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-600">
          No quiz submissions yet.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[60rem] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Quiz name</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Type</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Attempts</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Participants</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Average</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Open</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.quizId} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">{item.quizTitle}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{typeLabel(item.quizType)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{item.attempts}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{item.participants}</td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {item.averagePercent}%
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <Link
                        to={`/admin/essay-submissions/quiz-scores/${item.quizId}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View participants
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
