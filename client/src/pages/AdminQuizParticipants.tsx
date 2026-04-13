import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, type QuizSubmissionOut } from "@/lib/api";

function userName(item: QuizSubmissionOut): string {
  const u = item.userId;
  if (u && typeof u === "object") return u.displayName?.trim() || u.email || "Unknown student";
  return "Unknown student";
}

function userEmail(item: QuizSubmissionOut): string {
  const u = item.userId;
  if (u && typeof u === "object") return u.email || "No email";
  return "No email";
}

export function AdminQuizParticipants() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [items, setItems] = useState<QuizSubmissionOut[]>([]);
  const [pending, setPending] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    const res = await api.admin.listQuizSubmissionsByQuiz(id);
    setQuizTitle(res.quiz.title || "Quiz");
    setItems(res.submissions);
  };

  useEffect(() => {
    if (!user || user.role !== "admin" || !id) return;
    let cancelled = false;
    (async () => {
      setPending(true);
      setErr(null);
      try {
        const res = await api.admin.listQuizSubmissionsByQuiz(id);
        if (cancelled) return;
        setQuizTitle(res.quiz.title || "Quiz");
        setItems(res.submissions);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load participants");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  const uniqueParticipants = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const uid = item.userId && typeof item.userId === "object" ? item.userId._id : String(item.userId || "");
      if (uid) set.add(uid);
    }
    return set.size;
  }, [items]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/admin/essay-submissions/quiz-scores" className="text-teal-600 hover:underline">
            ← Quiz score submissions
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          {quizTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Participants: <span className="font-semibold text-slate-800">{uniqueParticipants}</span> · Attempts:{" "}
          <span className="font-semibold text-slate-800">{items.length}</span>
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              if (!id) return;
              if (!confirm("Clear ALL submissions for this quiz? This cannot be undone.")) return;
              setErr(null);
              setPending(true);
              try {
                await api.admin.clearQuizSubmissions(id);
                await refresh();
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Failed to clear submissions");
              } finally {
                setPending(false);
              }
            }}
            disabled={pending || items.length === 0}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
          >
            Clear quiz submissions
          </button>
        </div>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}
      {pending ? <p className="text-sm text-slate-500">Loading participants…</p> : null}

      {!pending && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-600">
          No submissions for this quiz yet.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[68rem] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Student
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Score</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Max score</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Percent</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Submitted</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-4 py-3 font-medium text-slate-900">
                      {userName(item)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{userEmail(item)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{item.score}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{item.maxScore}</td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {item.percent}%
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Delete this submission? This cannot be undone.")) return;
                          setErr(null);
                          setPending(true);
                          try {
                            await api.admin.deleteQuizSubmission(item._id);
                            await refresh();
                          } catch (e) {
                            setErr(e instanceof Error ? e.message : "Failed to delete submission");
                          } finally {
                            setPending(false);
                          }
                        }}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                      >
                        Delete
                      </button>
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
