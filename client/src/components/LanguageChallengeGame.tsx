import { useMemo, useState } from "react";

type ChallengeQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export function LanguageChallengeGame({
  title,
  description,
  questions,
}: {
  title?: string;
  description?: string;
  questions: ChallengeQuestion[];
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => new Array(questions.length).fill(-1));
  const [checked, setChecked] = useState<number[]>(() => new Array(questions.length).fill(-1));

  const q = questions[idx];
  const selected = answers[idx] ?? -1;
  const checkedAnswer = checked[idx] ?? -1;
  const revealed = checkedAnswer >= 0;
  const isCorrect = revealed && checkedAnswer === q?.correctIndex;

  const progress = useMemo(() => {
    const attempted = checked.filter((n) => n >= 0).length;
    const correct = checked.reduce((sum, value, i) => (value === questions[i]?.correctIndex ? sum + 1 : sum), 0);
    const pct = questions.length ? Math.round((attempted / questions.length) * 100) : 0;
    return { attempted, correct, total: questions.length, pct };
  }, [checked, questions]);

  if (!questions.length) {
    return <p className="text-sm text-slate-500">Add challenge questions in Admin to play this game.</p>;
  }

  return (
    <div className="space-y-5">
      {(title || description) && (
        <div>
          {title ? (
            <h2 className="text-xl font-semibold text-slate-800" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              {title}
            </h2>
          ) : null}
          {description ? <p className="mt-1 text-slate-600">{description}</p> : null}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-slate-700">
            Question {idx + 1} of {questions.length}
          </p>
          <p className="text-slate-500">
            Score:{" "}
            <span className="font-semibold text-teal-700">
              {progress.correct}/{progress.total}
            </span>
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-300 via-amber-300 to-teal-500 transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-teal-50/40 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{q.prompt}</h3>
        <ul className="mt-4 grid gap-2">
          {q.options.map((option, optionIdx) => {
            const active = selected === optionIdx;
            const showCorrect = revealed && optionIdx === q.correctIndex;
            const showWrong = revealed && checkedAnswer === optionIdx && optionIdx !== q.correctIndex;
            return (
              <li key={`${idx}-${optionIdx}`}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => {
                    const next = [...answers];
                    next[idx] = optionIdx;
                    setAnswers(next);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    showCorrect
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm"
                      : showWrong
                        ? "border-rose-300 bg-rose-50 text-rose-800 shadow-sm"
                        : active
                          ? "border-teal-400 bg-teal-50 text-slate-900 shadow-sm ring-1 ring-teal-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                  }`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        {revealed ? (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
              isCorrect ? "animate-pulse border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {isCorrect ? "Correct! Great job." : "Not quite. Review and continue."}
            {q.explanation ? <p className="mt-1 text-slate-700">{q.explanation}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
        >
          Back
        </button>
        {!revealed ? (
          <button
            type="button"
            disabled={selected < 0}
            onClick={() => {
              const next = [...checked];
              next[idx] = selected;
              setChecked(next);
            }}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={idx >= questions.length - 1}
            className="rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
