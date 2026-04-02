import { useEffect, useMemo, useState } from "react";
import type { VocabWord } from "@/lib/api";

function scramble(s: string, depth = 0): string {
  if (depth > 25) return s;
  const arr = s.split("");
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const out = arr.join("");
  return out === s && s.length > 1 ? scramble(s, depth + 1) : out;
}

export function WordScrambleGame({
  title,
  description,
  words,
  answerSide,
  scrambleMode,
  customPuzzles,
  showHint = true,
}: {
  title?: string;
  description?: string;
  words: VocabWord[];
  answerSide: "bikol" | "english";
  scrambleMode?: "vocabulary" | "custom";
  customPuzzles?: { letters: string; answer: string; hint?: string }[];
  showHint?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);

  const useCustom = scrambleMode === "custom";
  const puzzle = useCustom ? customPuzzles?.[idx] : null;
  const word = words[idx];

  useEffect(() => {
    if (useCustom) {
      if (!puzzle) return;
      setScrambled(String(puzzle.letters || "").trim().toUpperCase());
    } else {
      if (!word) return;
      const ans = answerSide === "bikol" ? word.bikol : word.english;
      setScrambled(scramble(ans.trim()));
    }
    setGuess("");
    setFeedback(null);
  }, [word, answerSide, idx, useCustom, puzzle]);

  const check = () => {
    const ans = useCustom
      ? String(puzzle?.answer || "").trim().toLowerCase()
      : (answerSide === "bikol" ? word?.bikol : word?.english)?.trim().toLowerCase();
    if (!ans) return;
    const g = guess.trim().toLowerCase();
    if (g === ans) {
      setFeedback("ok");
    } else {
      setFeedback("no");
    }
  };

  const next = () => {
    const total = useCustom ? customPuzzles?.length || 0 : words.length;
    setIdx((i) => (total ? (i + 1) % total : 0));
  };

  const hint = useMemo(() => {
    if (useCustom) return puzzle?.hint ? `Hint: ${puzzle.hint}` : "";
    if (!word) return "";
    return answerSide === "bikol" ? `English: ${word.english}` : `Bikol: ${word.bikol}`;
  }, [word, answerSide, useCustom, puzzle]);

  if (useCustom && (!customPuzzles || customPuzzles.length === 0)) {
    return <p className="text-sm text-slate-500">Add custom scramble puzzles in Admin to play this game.</p>;
  }

  if (!useCustom && !words.length) {
    return (
      <p className="text-sm text-slate-500">Add vocabulary words to play this game.</p>
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
        <p className="font-medium">How to play</p>
        <p className="mt-1">
          Rearrange the letter boxes and type the correct word, then press <strong>Check</strong>.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {scrambled.split("").map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-teal-200 bg-white text-lg font-bold uppercase text-teal-700 shadow-sm"
          >
            {ch}
          </span>
        ))}
      </div>
      {showHint ? <p className="text-center text-xs text-slate-500">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          placeholder="Your answer"
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Check
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
        >
          Next word
        </button>
      </div>
      {feedback === "ok" ? <p className="text-sm font-medium text-emerald-600">Correct!</p> : null}
      {feedback === "no" ? <p className="text-sm text-rose-600">Not quite — try again.</p> : null}
    </div>
  );
}
