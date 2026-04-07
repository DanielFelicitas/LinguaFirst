import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, type EssaySubmissionOut, type QuizOut } from "@/lib/api";

function quizLabel(sub: EssaySubmissionOut): string {
  const q = sub.quizId;
  if (q && typeof q === "object") return q.title || "Essay quiz";
  return "Essay quiz";
}

function studentName(sub: EssaySubmissionOut): string {
  const u = sub.userId;
  if (u && typeof u === "object") return u.displayName?.trim() || u.email || "Unknown student";
  return "Unknown student";
}

function studentEmail(sub: EssaySubmissionOut): string {
  const u = sub.userId;
  if (u && typeof u === "object") return u.email || "No email";
  return "No email";
}

function submissionQuizId(sub: EssaySubmissionOut): string {
  const q = sub.quizId;
  return q && typeof q === "object" ? q._id : String(q || "");
}

function groupByQuiz(submissions: EssaySubmissionOut[]): { quizId: string; quizTitle: string; items: EssaySubmissionOut[] }[] {
  const map = new Map<string, { quizId: string; quizTitle: string; items: EssaySubmissionOut[] }>();
  for (const s of submissions) {
    const id = submissionQuizId(s) || "unknown";
    const title = quizLabel(s);
    const current = map.get(id);
    if (current) {
      current.items.push(s);
    } else {
      map.set(id, { quizId: id, quizTitle: title, items: [s] });
    }
  }
  return [...map.values()];
}

export function AdminEssaySubmissions() {
  const { user, loading } = useAuth();
  const [quizId, setQuizId] = useState("");
  const [quizzes, setQuizzes] = useState<QuizOut[]>([]);
  const [submissions, setSubmissions] = useState<EssaySubmissionOut[]>([]);
  const [pending, setPending] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openSubmissionId, setOpenSubmissionId] = useState<string | null>(null);
  const [gradeDraft, setGradeDraft] = useState<
    { score: string; maxScore: string; feedback: string }[] | null
  >(null);

  const openSubmission = useMemo(
    () => submissions.find((s) => s._id === openSubmissionId) ?? null,
    [submissions, openSubmissionId]
  );

  const refresh = async (qid?: string) => {
    const res = await api.admin.listEssaySubmissions(qid);
    setSubmissions(res.submissions);
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    (async () => {
      setPending(true);
      setErr(null);
      try {
        const [quizRes, subRes] = await Promise.all([
          api.quizzes(),
          api.admin.listEssaySubmissions(),
        ]);
        if (cancelled) return;
        const essayQuizzes = quizRes.quizzes.filter((q) => q.quizType === "essay");
        setQuizzes(essayQuizzes);
        setSubmissions(subRes.submissions);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load submissions");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    (async () => {
      setPending(true);
      setErr(null);
      try {
        const res = await api.admin.listEssaySubmissions(quizId || undefined);
        if (!cancelled) setSubmissions(res.submissions);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to filter submissions");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId, user]);

  const totalAnswers = useMemo(
    () => submissions.reduce((acc, s) => acc + (s.responses?.length || 0), 0),
    [submissions]
  );
  const grouped = useMemo(() => groupByQuiz(submissions), [submissions]);
  const totalParticipants = submissions.length;

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/dashboard" className="text-teal-600 hover:underline">
            ← Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          Essay submissions
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review all student essay answers with their name and email.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_14rem_14rem] lg:items-end">
          <label className="block text-sm">
            <span className="text-slate-600">Filter by essay quiz</span>
            <select
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">All essay quizzes</option>
              {quizzes.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 lg:justify-end">
            <button
              type="button"
              onClick={async () => {
                const label = quizId ? "this quiz" : "ALL essay submissions";
                if (!confirm(`Clear ${label}? This cannot be undone.`)) return;
                setErr(null);
                setPending(true);
                try {
                  await api.admin.clearEssaySubmissions(quizId || undefined);
                  setOpenSubmissionId(null);
                  await refresh(quizId || undefined);
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Failed to clear submissions");
                } finally {
                  setPending(false);
                }
              }}
              className="h-11 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              disabled={pending || submissions.length === 0}
            >
              Clear
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-slate-500">Quizzes</p>
            <p className="text-lg font-semibold text-slate-900">{grouped.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-slate-500">Participants</p>
            <p className="text-lg font-semibold text-slate-900">{totalParticipants}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-slate-500">Total answers</p>
            <p className="text-lg font-semibold text-slate-900">{totalAnswers}</p>
          </div>
        </div>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}
      {pending ? <p className="text-sm text-slate-500">Loading submissions…</p> : null}

      {!pending && submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-600">
          No essay submissions yet.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.quizId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {group.quizTitle}
                </h2>
                <p className="text-sm text-slate-500">{group.items.length} participant(s)</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                          Student
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Email</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Submitted</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Answers</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((s, i) => {
                        const isOpen = openSubmissionId === s._id;
                        return (
                          <tr
                            key={s._id}
                            className={`cursor-pointer ${
                              i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                            } hover:bg-teal-50/60`}
                            onClick={() => setOpenSubmissionId(s._id)}
                          >
                            <td className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-4 py-3 align-top">
                              <p className="text-base font-semibold text-slate-900">{studentName(s)}</p>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-3 align-top">
                              <span className="text-slate-700">{studentEmail(s)}</span>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-600">
                              {new Date(s.createdAt).toLocaleString()}
                            </td>
                            <td className="border-b border-slate-100 px-4 py-3 align-top">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {s.responses?.length || 0}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSubmissionId(s._id);
                                }}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                  isOpen
                                    ? "border-teal-300 bg-teal-50 text-teal-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {openSubmission ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close submission"
            onClick={() => setOpenSubmissionId(null)}
          />
          <div className="absolute inset-x-0 bottom-0 top-0 mx-auto flex max-w-6xl flex-col bg-white shadow-2xl sm:inset-6 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Essay submission</p>
                <h2 className="mt-1 truncate text-xl font-semibold text-slate-900 sm:text-2xl">
                  {studentName(openSubmission)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{studentEmail(openSubmission)}</p>
                <p className="mt-1 text-sm font-medium text-teal-700">{quizLabel(openSubmission)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      gradeDraft ??
                      (openSubmission.responses || []).map((r) => ({
                        score: r.score === null || r.score === undefined ? "" : String(r.score),
                        maxScore: r.maxScore === null || r.maxScore === undefined ? "" : String(r.maxScore),
                        feedback: r.feedback || "",
                      }));
                    setGradeDraft(next);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Grade
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Delete this submission? This cannot be undone.")) return;
                    setErr(null);
                    setPending(true);
                    try {
                      await api.admin.deleteEssaySubmission(openSubmission._id);
                      setOpenSubmissionId(null);
                      await refresh(quizId || undefined);
                    } catch (e) {
                      setErr(e instanceof Error ? e.message : "Failed to delete submission");
                    } finally {
                      setPending(false);
                    }
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setOpenSubmissionId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {gradeDraft ? (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-amber-950">Grading (per question)</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGradeDraft(null)}
                        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setErr(null);
                          setPending(true);
                          try {
                            const grades = gradeDraft.map((g) => ({
                              score: g.score.trim() ? Number(g.score) : null,
                              maxScore: g.maxScore.trim() ? Number(g.maxScore) : null,
                              feedback: g.feedback,
                            }));
                            await api.admin.gradeEssaySubmission(openSubmission._id, grades);
                            setGradeDraft(null);
                            await refresh(quizId || undefined);
                          } catch (e) {
                            setErr(e instanceof Error ? e.message : "Failed to save grades");
                          } finally {
                            setPending(false);
                          }
                        }}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                        disabled={pending}
                      >
                        Save grades
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {openSubmission.responses.map((r, i) => (
                      <div key={i} className="rounded-xl border border-amber-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-700">Q{i + 1}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.prompt}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <label className="text-xs text-slate-600">
                            Score
                            <input
                              value={gradeDraft[i]?.score ?? ""}
                              onChange={(e) => {
                                const next = [...gradeDraft];
                                next[i] = { ...next[i]!, score: e.target.value };
                                setGradeDraft(next);
                              }}
                              inputMode="decimal"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="text-xs text-slate-600">
                            Max
                            <input
                              value={gradeDraft[i]?.maxScore ?? ""}
                              onChange={(e) => {
                                const next = [...gradeDraft];
                                next[i] = { ...next[i]!, maxScore: e.target.value };
                                setGradeDraft(next);
                              }}
                              inputMode="decimal"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                        <label className="mt-2 block text-xs text-slate-600">
                          Feedback (optional)
                          <textarea
                            value={gradeDraft[i]?.feedback ?? ""}
                            onChange={(e) => {
                              const next = [...gradeDraft];
                              next[i] = { ...next[i]!, feedback: e.target.value };
                              setGradeDraft(next);
                            }}
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                {(openSubmission.responses || []).map((r, i) => (
                  <article key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      {i + 1}. {r.prompt}
                    </p>
                    {r.score !== null && r.score !== undefined ? (
                      <p className="mt-2 text-xs font-semibold text-amber-800">
                        Grade: {r.score}
                        {r.maxScore !== null && r.maxScore !== undefined ? ` / ${r.maxScore}` : ""}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-slate-400">Not graded yet</p>
                    )}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{r.answer}</p>
                    </div>
                    {r.feedback?.trim() ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Feedback</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">{r.feedback}</p>
                      </div>
                    ) : null}
                    {r.sampleAnswer?.trim() ? (
                      <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                          Reference answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-teal-900">{r.sampleAnswer}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              <p className="mt-6 text-xs text-slate-400">
                Submitted: {new Date(openSubmission.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
