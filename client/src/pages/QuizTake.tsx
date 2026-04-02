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
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .quiz(id)
      .then((d) => {
        setQuiz(d.quiz);
        setAnswers(new Array(d.quiz.questions.length).fill(-1));
        setDone(false);
        setIdx(0);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const resultSummary = useMemo(() => {
    if (!quiz || !done) return null;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    const total = quiz.questions.length;
    return {
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [quiz, done, answers]);

  const submitFinal = async () => {
    if (!quiz) return;
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
    const { correct, total, pct } = resultSummary;
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <p className="text-sm text-slate-500">
          <Link to="/quiz" className="text-teal-600 hover:underline">
            Quizzes
          </Link>
          <span className="mx-2">/</span>
          {quiz.title}
        </p>

        <div className="overflow-hidden rounded-2xl border-2 border-teal-200/90 bg-gradient-to-b from-white to-teal-50/40 px-6 py-8 text-center shadow-md shadow-teal-100/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Your results</p>
          <h1
            className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {quiz.title}
          </h1>
          <p className="mt-6 text-5xl font-bold tabular-nums text-gradient sm:text-6xl">{pct}%</p>
          <p className="mt-2 text-lg font-medium text-slate-800">
            You got <span className="text-teal-700">{correct}</span> out of <span className="text-slate-900">{total}</span>{" "}
            correct
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">{scoreMessage(pct)}</p>
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

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Review</h2>
          <ul className="space-y-3">
            {quiz.questions.map((q, i) => {
              const picked = answers[i];
              const ok = picked === q.correctIndex;
              const pickedLabel = picked >= 0 && q.options[picked] != null ? q.options[picked] : "—";
              const correctLabel = q.options[q.correctIndex] ?? "—";
              return (
                <li
                  key={i}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    ok ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-semibold" aria-hidden>
                      {ok ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{q.prompt}</p>
                      <p className="mt-1 text-slate-600">
                        Your answer: <span className="text-slate-800">{pickedLabel}</span>
                      </p>
                      {!ok ? (
                        <p className="mt-1 text-emerald-800">
                          Correct: <span className="font-medium">{correctLabel}</span>
                        </p>
                      ) : null}
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
  const answeredHere = answers[idx] >= 0;
  const stepPct = Math.round(((idx + 1) / total) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-6">
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

      <h2 className="text-xl font-medium leading-snug text-slate-800">{q.prompt}</h2>
      <ul className="space-y-2">
        {q.options.map((opt, oi) => (
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
            disabled={answers.some((a) => a < 0)}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finish & see score
          </button>
        )}
      </div>
    </div>
  );
}
