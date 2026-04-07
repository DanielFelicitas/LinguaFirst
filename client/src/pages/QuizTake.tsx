import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, type QuizOut } from "@/lib/api";
import { saveQuizResult } from "@/lib/quizScores";

function scoreMessage(pct: number): string {
  if (pct >= 100) return "Perfect — outstanding!";
  if (pct >= 80) return "Great work — you really know this material.";
  if (pct >= 50) return "Nice effort — review the missed items and try again anytime.";
  return "Keep practicing — every attempt helps the patterns stick.";
}

export function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [essayAnswers, setEssayAnswers] = useState<string[]>([]);
  const [essaySubmission, setEssaySubmission] = useState<any>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .quiz(id)
      .then((d) => {
        setQuiz(d.quiz);
        const isEssay = d.quiz.quizType === "essay";
        setAnswers(new Array(d.quiz.questions.length).fill(isEssay ? 0 : -1));
        setEssayAnswers(new Array(d.quiz.questions.length).fill(""));
        setDone(false);
        setIdx(0);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const resultSummary = useMemo(() => {
    if (!quiz || !done) return null;
    if (quiz.quizType === "essay") {
      const total = quiz.questions.length;
      const submitted = essayAnswers.filter((a) => a.trim().length > 0).length;
      return { mode: "essay" as const, submitted, total };
    }
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    const total = quiz.questions.length;
    return {
      mode: "objective" as const,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [quiz, done, answers, essayAnswers]);

  const submitFinal = async () => {
    if (!quiz) return;
    if (quiz.quizType === "essay") {
      if (!user) {
        setErr("Please sign in first so your name and email are attached to your essay submission.");
        return;
      }
      await api.submitEssayQuiz(
        quiz._id,
        essayAnswers.map((a) => a.trim())
      );
      setDone(true);
      try {
        const latest = await api.myEssaySubmission(quiz._id);
        setEssaySubmission(latest.submission);
      } catch {
        /* ignore */
      }
      try {
        await api.analytics({
          name: "quiz_complete",
          path: `/quiz/${quiz._id}`,
          meta: {
            quizId: quiz._id,
            mode: "essay",
            submitted: essayAnswers.filter((a) => a.trim().length > 0).length,
            total: quiz.questions.length,
          },
        });
      } catch {
        /* ignore */
      }
      return;
    }
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    const total = quiz.questions.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    saveQuizResult(quiz._id, correct, total, pct);
    setDone(true);
    if (!user) return;
    try {
      await api.analytics({
        name: "quiz_complete",
        path: `/quiz/${quiz._id}`,
        meta: { quizId: quiz._id, score: pct, correct, total },
      });
    } catch {
      /* ignore */
    }
  };

  if (loading) return <p className="text-slate-500">Loading quiz…</p>;
  if (err || !quiz)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        {err || "Not found"}
      </div>
    );

  if (done && resultSummary) {
    const isEssay = resultSummary.mode === "essay";
    const gradeSummary =
      isEssay && essaySubmission?.responses
        ? {
            totalScore: (essaySubmission.responses as any[]).reduce(
              (acc, r) => acc + (typeof r?.score === "number" ? r.score : 0),
              0
            ),
            totalMax: (essaySubmission.responses as any[]).reduce(
              (acc, r) => acc + (typeof r?.maxScore === "number" ? r.maxScore : 0),
              0
            ),
            gradedCount: (essaySubmission.responses as any[]).filter((r) => typeof r?.score === "number").length,
          }
        : null;
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="text-sm text-slate-500">
          <Link to="/quiz" className="text-teal-600 hover:underline">
            Quizzes
          </Link>
          <span className="mx-2">/</span>
          {quiz.title}
        </p>

        <div className="overflow-hidden rounded-2xl border-2 border-teal-200/90 bg-gradient-to-b from-white to-teal-50/40 px-6 py-8 text-center shadow-md shadow-teal-100/50 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            {isEssay ? "Submission complete" : "Your results"}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {quiz.title}
          </h1>
          {isEssay ? (
            <>
              <p className="mt-6 text-2xl font-semibold text-slate-900 sm:text-3xl">
                You answered {resultSummary.submitted} out of {resultSummary.total} questions
              </p>
              {gradeSummary ? (
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-700">
                  Grade:{" "}
                  <span className="font-semibold text-slate-900">
                    {gradeSummary.totalScore}
                    {gradeSummary.totalMax > 0 ? ` / ${gradeSummary.totalMax}` : ""}
                  </span>{" "}
                  <span className="text-slate-500">(graded {gradeSummary.gradedCount}/{resultSummary.total})</span>
                </p>
              ) : (
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
                  Essay responses are saved for review. Your grade will appear here after your teacher marks it.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-6 text-5xl font-bold tabular-nums text-gradient sm:text-6xl">{resultSummary.pct}%</p>
              <p className="mt-2 text-lg font-medium text-slate-800">
                You got <span className="text-teal-700">{resultSummary.correct}</span> out of{" "}
                <span className="text-slate-900">{resultSummary.total}</span> correct
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
                {scoreMessage(resultSummary.pct)}
              </p>
            </>
          )}
          {user ? (
            <p className="mt-3 text-xs text-slate-500">This attempt is recorded in your activity.</p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              <Link to="/login" className="font-medium text-teal-600 hover:underline">
                Sign in
              </Link>{" "}
              to sync progress; your score is still saved on this device.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Review</h2>
          <ul className="space-y-3">
            {quiz.questions.map((q, i) => {
              const picked = answers[i];
              const ok = picked === q.correctIndex;
              const pickedLabel = picked >= 0 && q.options?.[picked] != null ? q.options[picked] : "—";
              const correctLabel =
                typeof q.correctIndex === "number" && q.options?.[q.correctIndex] != null
                  ? q.options[q.correctIndex]
                  : "—";
              return (
                <li
                  key={i}
                  className={`rounded-xl border px-4 py-4 text-sm ${
                    quiz.quizType === "essay"
                      ? "border-slate-200 bg-slate-50/70"
                      : ok
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-semibold" aria-hidden>
                      {ok ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{q.prompt}</p>
                      {quiz.quizType === "essay" ? (
                        <>
                          <p className="mt-1 whitespace-pre-wrap text-slate-700">
                            Your answer: <span className="text-slate-900">{essayAnswers[i]?.trim() || "—"}</span>
                          </p>
                          {q.sampleAnswer?.trim() ? (
                            <p className="mt-1 whitespace-pre-wrap text-teal-800">
                              Reference answer: <span className="font-medium">{q.sampleAnswer}</span>
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="mt-1 text-slate-600">
                            Your answer: <span className="text-slate-800">{pickedLabel}</span>
                          </p>
                          {!ok ? (
                            <p className="mt-1 text-emerald-800">
                              Correct: <span className="font-medium">{correctLabel}</span>
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 pb-8">
          <Link
            to="/quiz"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            More quizzes
          </Link>
          <Link
            to="/lessons"
            className="rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
          >
            Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  const q = quiz.questions[idx];
  const total = quiz.questions.length;
  const isEssayQuiz = quiz.quizType === "essay";
  const answeredHere = isEssayQuiz ? (essayAnswers[idx] || "").trim().length > 0 : answers[idx] >= 0;
  const stepPct = Math.round(((idx + 1) / total) * 100);

  if (isEssayQuiz) {
    const missing = essayAnswers.some((a) => !a.trim());
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-10">
        <p className="text-sm text-slate-500">
          <Link to="/quiz" className="text-teal-600 hover:underline">
            Quizzes
          </Link>
          <span className="mx-2">/</span>
          {quiz.title}
        </p>

        <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Essay quiz</p>
              <h1
                className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl"
                style={{ fontFamily: "Fraunces, Georgia, serif" }}
              >
                {quiz.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Answer all questions below, then submit at the bottom.
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-slate-500">
              <p>{total} question(s)</p>
            </div>
          </div>
        </div>

        {!user ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Please{" "}
            <Link to="/login" className="font-medium underline">
              sign in
            </Link>{" "}
            to submit essay answers with your name and email.
          </p>
        ) : null}

        <div className="space-y-4">
          {quiz.questions.map((qq, i) => (
            <section key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-semibold text-slate-900">
                {i + 1}. {qq.prompt}
              </p>
              <textarea
                value={essayAnswers[i] || ""}
                onChange={(e) => {
                  const next = [...essayAnswers];
                  next[i] = e.target.value;
                  setEssayAnswers(next);
                }}
                rows={5}
                placeholder="Type your answer here..."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </section>
          ))}
        </div>

        {missing ? (
          <p className="text-center text-sm text-amber-800/90">
            Please answer all questions to submit.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            to="/quiz"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to quizzes
          </Link>
          <button
            type="button"
            onClick={() => void submitFinal()}
            disabled={missing || !user}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-slate-500">
        <Link to="/quiz" className="text-teal-600 hover:underline">
          Quizzes
        </Link>
        <span className="mx-2">/</span>
        {quiz.title}
      </p>

      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">
            Question {idx + 1} of {total}
          </span>
          <span className="text-xs text-slate-500">Finish to see your score</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300"
            style={{ width: `${stepPct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-slate-400">{stepPct}% through the quiz</p>
      </div>

      <h2 className="text-xl font-medium leading-snug text-slate-800 sm:text-2xl">{q.prompt}</h2>
      <ul className="space-y-2">
        {(q.options || []).map((opt, oi) => (
          <li key={oi}>
            <button
              type="button"
              onClick={() => {
                const next = [...answers];
                next[idx] = oi;
                setAnswers(next);
              }}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                answers[idx] === oi
                  ? "border-teal-400 bg-teal-50 text-slate-900 shadow-sm ring-1 ring-teal-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
              }`}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
      {!answeredHere ? (
        <p className="text-center text-sm text-amber-800/90">Choose an answer to continue</p>
      ) : null}
      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm disabled:opacity-40"
        >
          Back
        </button>
        {idx < total - 1 ? (
          <button
            type="button"
            disabled={!answeredHere}
            onClick={() => setIdx((i) => i + 1)}
            className="rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submitFinal()}
            disabled={isEssayQuiz ? essayAnswers.some((a) => !a.trim()) : answers.some((a) => a < 0)}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEssayQuiz ? "Submit answers" : "Finish & see score"}
          </button>
        )}
      </div>
    </div>
  );
}
