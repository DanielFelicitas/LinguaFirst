import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabWord } from "@/lib/api";

type Card = { id: string; text: string; pairId: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(words: VocabWord[], pairCount: number): Card[] {
  const n = Math.min(pairCount, Math.max(0, words.length));
  const subset = words.slice(0, n);
  const deck: Card[] = [];
  subset.forEach((w) => {
    const pairId = w._id;
    deck.push({ id: `${pairId}-b`, text: w.bikol, pairId, flipped: false, matched: false });
    deck.push({ id: `${pairId}-e`, text: w.english, pairId, flipped: false, matched: false });
  });
  return shuffle(deck);
}

export function MatchPairsBoard({
  title,
  description,
  words,
  pairCount,
}: {
  title?: string;
  description?: string;
  words: VocabWord[];
  pairCount: number;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    setCards(buildDeck(words, pairCount));
    setPicked([]);
  }, [words, pairCount]);

  const onPick = useCallback(
    (id: string) => {
      const card = cards.find((c) => c.id === id);
      if (!card || card.matched || card.flipped) return;
      if (picked.length === 1 && picked[0] === id) return;

      const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
      setCards(next);

      if (picked.length === 0) {
        setPicked([id]);
        return;
      }

      const firstId = picked[0];
      const a = next.find((c) => c.id === firstId);
      const b = next.find((c) => c.id === id);
      if (a && b && a.pairId === b.pairId) {
        setCards((cur) =>
          cur.map((c) => (c.pairId === a.pairId ? { ...c, matched: true, flipped: true } : c))
        );
        setPicked([]);
      } else {
        setPicked([firstId, id]);
        setTimeout(() => {
          setCards((cur) =>
            cur.map((c) => (c.id === firstId || c.id === id ? { ...c, flipped: false } : c))
          );
          setPicked([]);
        }, 700);
      }
    },
    [cards, picked]
  );

  const allMatched = useMemo(
    () => cards.length > 0 && cards.every((c) => c.matched),
    [cards]
  );

  const reset = () => {
    setCards(buildDeck(words, pairCount));
    setPicked([]);
  };

  const need = Math.min(pairCount, 6);
  if (words.length < need) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
        <p className="font-medium">{title || "Match pairs"}</p>
        <p className="mt-1 text-amber-800">
          Need at least {need} vocabulary words{title ? "" : ""}. Add more in Admin → content or vocabulary.
        </p>
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
      {allMatched ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-6 text-center shadow-sm">
          <p className="text-lg font-medium text-teal-800">All pairs matched — maayong trabaho!</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-6 py-2.5 text-sm font-semibold text-slate-800 shadow-sm"
          >
            Play again
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className={`min-h-[88px] rounded-xl border px-2 py-3 text-center text-sm font-medium transition ${
              c.matched
                ? "border-teal-300 bg-teal-50 text-teal-900 shadow-sm"
                : c.flipped
                  ? "border-amber-200 bg-amber-50 text-amber-900 shadow-sm"
                  : "border-slate-200 bg-white text-transparent shadow-sm hover:border-rose-200"
            }`}
          >
            {c.matched || c.flipped ? c.text : "?"}
          </button>
        ))}
      </div>
    </div>
  );
}
