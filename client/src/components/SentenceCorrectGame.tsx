import { useMemo, useState } from "react";

export type SentenceCorrectItem = {
  sentence: string;
  correct: boolean;
  explanation?: string;
};

export function SentenceCorrectGame({
  title,
  description,
  items,
  maxItems,
}: {
  title?: string;
  description?: string;
  items: SentenceCorrectItem[];
  maxItems?: number;
}) {
  const list = useMemo(() => items.slice(0, Math.max(1, maxItems ?? items.length)), [items, maxItems]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Array<null | boolean>>(() => new Array(list.length).fill(null));

  const item = list[idx];
  const answered = picked[idx] !== null;

  const score = useMemo(() => {
    let correct = 0;
    let attempted = 0;
    picked.forEach((p, i) => {
      if (p === null) return;
      attempted += 1;
      if (p === list[i]?.correct) correct += 1;
    });
    return { correct, attempted, total: list.length };
  }, [picked, list]);

  if (!list.length) return <p className="text-sm text-slate-500">Add sentence items in Admin to play this game.</p>;

  return (
    <div className="space-y-4">
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

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
        Read the sentence. Is it correct? Choose <strong>Correct</strong> or <strong>Incorrect</strong>.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">
            Item {idx + 1}/{list.length}
          </span>
          <span>
            Score: <span className="font-semibold text-teal-700">{score.correct}</span>/{score.total}
          </span>
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">{item.sentence}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={answered}
            onClick={() => {
              const next = [...picked];
              next[idx] = true;
              setPicked(next);
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Correct
          </button>
          <button
            type="button"
            disabled={answered}
            onClick={() => {
              const next = [...picked];
              next[idx] = false;
              setPicked(next);
            }}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Incorrect
          </button>
        </div>

        {answered ? (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
              picked[idx] === item.correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {picked[idx] === item.correct ? "Correct!" : "Not quite."}
            {item.explanation ? <p className="mt-1 text-slate-700">{item.explanation}</p> : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-800">Choose Correct or Incorrect first.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))}
          disabled={idx >= list.length - 1 || !answered}
          className="rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

