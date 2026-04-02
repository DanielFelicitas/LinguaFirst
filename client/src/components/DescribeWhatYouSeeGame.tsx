import { useEffect, useMemo, useState } from "react";
import { GameCompletionSummary } from "@/components/GameCompletionSummary";

export type DescribeSeeItem = {
  imageDataUrl?: string;
  prompt?: string;
  options: string[];
  correctIndex: number;
};

export function DescribeWhatYouSeeGame({
  title,
  description,
  items,
  maxItems,
}: {
  title?: string;
  description?: string;
  items: DescribeSeeItem[];
  maxItems?: number;
}) {
  const list = useMemo(() => items.slice(0, Math.max(1, maxItems ?? items.length)), [items, maxItems]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>(() => new Array(list.length).fill(-1));
  const [showComplete, setShowComplete] = useState(false);

  const item = list[idx];
  const selected = picked[idx] ?? -1;
  const answered = selected >= 0;
  const isCorrect = answered && selected === item.correctIndex;

  const score = useMemo(() => {
    let correct = 0;
    let attempted = 0;
    picked.forEach((p, i) => {
      if (p < 0) return;
      attempted += 1;
      if (p === list[i]?.correctIndex) correct += 1;
    });
    return { correct, attempted, total: list.length };
  }, [picked, list]);

  const allAnswered = useMemo(() => picked.every((p) => p >= 0), [picked]);

  useEffect(() => {
    if (allAnswered && list.length > 0) setShowComplete(true);
  }, [allAnswered, list.length]);

  const resetRound = () => {
    setPicked(new Array(list.length).fill(-1));
    setIdx(0);
    setShowComplete(false);
  };

  if (!list.length) return <p className="text-sm text-slate-500">Add describe items in Admin to play this game.</p>;

  if (showComplete) {
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
        <GameCompletionSummary score={score.correct} total={score.total} onPlayAgain={resetRound} />
      </div>
    );
  }

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
        Look at the picture (or prompt) and choose the best description.
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

        {item.imageDataUrl ? (
          <img
            src={item.imageDataUrl}
            alt={item.prompt || "Describe what you see"}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white object-contain"
          />
        ) : null}
        {item.prompt ? <p className="mt-4 text-sm font-medium text-slate-800">{item.prompt}</p> : null}

        <ul className="mt-4 space-y-2">
          {item.options.map((opt, oi) => {
            const showCorrect = answered && oi === item.correctIndex;
            const showWrong = answered && oi === selected && oi !== item.correctIndex;
            const active = selected === oi;
            return (
              <li key={`${idx}-${oi}`}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => {
                    const next = [...picked];
                    next[idx] = oi;
                    setPicked(next);
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
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>

        {answered ? (
          <p className={`mt-4 text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-amber-900"}`}>
            {isCorrect ? "Correct!" : "Not quite — try the next one."}
          </p>
        ) : (
          <p className="mt-4 text-sm text-amber-800">Choose one option first.</p>
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

