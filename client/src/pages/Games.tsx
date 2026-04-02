import { useEffect, useState } from "react";
import { DescribeWhatYouSeeGame, type DescribeSeeItem } from "@/components/DescribeWhatYouSeeGame";
import { SentenceCorrectGame, type SentenceCorrectItem } from "@/components/SentenceCorrectGame";
import { WordScrambleGame } from "@/components/WordScrambleGame";
import { WordSearchGame } from "@/components/WordSearchGame";
import { api, type GameOut, type VocabWord } from "@/lib/api";

function pickFirst(games: GameOut[], type: GameOut["gameType"]): GameOut | null {
  return games.find((g) => g.gameType === type) ?? null;
}

function defaultSentenceItems(): SentenceCorrectItem[] {
  return [
    { sentence: "I am going to school.", correct: true, explanation: "This is a correct English sentence." },
    { sentence: "She go to the market.", correct: false, explanation: "Use “goes” for he/she/it: “She goes…”" },
    { sentence: "They are happy today.", correct: true },
  ];
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function defaultDescribeItems(): DescribeSeeItem[] {
  const img1 = svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#ECFEFF"/><circle cx="160" cy="180" r="72" fill="#14B8A6"/><rect x="320" y="120" width="220" height="140" rx="24" fill="#FDE68A"/><text x="320" y="96" font-family="Arial" font-size="22" fill="#0F172A">Describe the scene</text></svg>`
  );
  const img2 = svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#FFF7ED"/><rect x="140" y="110" width="360" height="180" rx="28" fill="#FB7185"/><text x="170" y="210" font-family="Arial" font-size="28" fill="white">A pink box</text></svg>`
  );
  return [
    {
      imageDataUrl: img1,
      prompt: "What do you see?",
      options: ["A teal circle and a yellow rectangle", "A purple triangle", "Only text"],
      correctIndex: 0,
    },
    {
      imageDataUrl: img2,
      prompt: "Pick the best description:",
      options: ["A pink box", "A green circle", "A blue star"],
      correctIndex: 0,
    },
  ];
}

export function Games() {
  const [games, setGames] = useState<GameOut[]>([]);
  const [wordsByKey, setWordsByKey] = useState<Record<string, VocabWord[]>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<
    "word_scramble" | "sentence_correct" | "describe_see" | "word_search" | null
  >(null);
  const [level, setLevel] = useState<"easy" | "medium" | "hard">("easy");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { games: g } = await api.games();
        if (cancelled) return;
        setGames(g);
        const keys = new Set<string>();
        g.forEach((game) => {
          const tag = game.config?.vocabularyTag?.trim();
          keys.add(tag || "__all__");
        });
        if (keys.size === 0) keys.add("__all__");
        const next: Record<string, VocabWord[]> = {};
        for (const key of keys) {
          const tag = key === "__all__" ? undefined : key;
          const { words } = await api.vocabulary({ limit: 200, tag });
          next[key] = words;
        }
        if (!cancelled) setWordsByKey(next);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackWords = wordsByKey["__all__"] || [];

  if (loading) return <p className="text-slate-500">Loading games…</p>;
  if (err)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{err}</div>
    );

  return (
    <div className="space-y-12">
      <div>
        <h1
          className="text-3xl font-semibold text-slate-800 md:text-4xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Games
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Four practice games — visible for everyone. Admins can customize each game from{" "}
          <strong className="text-slate-800">Admin → Content → Games</strong>.
        </p>
      </div>

      {(() => {
        const scramble = pickFirst(games, "word_scramble");
        const sentence = pickFirst(games, "sentence_correct");
        const describe = pickFirst(games, "describe_see");
        const search = pickFirst(games, "word_search");

        const scrambleTag = scramble?.config?.vocabularyTag?.trim();
        const scrambleKey = scrambleTag || "__all__";
        const scrambleWords = wordsByKey[scrambleKey] || fallbackWords;
        const scrambleAnswerSide = scramble?.config?.answerSide === "english" ? "english" : "bikol";

        const searchTag = search?.config?.vocabularyTag?.trim();
        const searchKey = searchTag || "__all__";
        const searchWords = wordsByKey[searchKey] || fallbackWords;

        const sentenceItems = Array.isArray((sentence?.config as any)?.items)
          ? ((sentence?.config as any).items as SentenceCorrectItem[])
          : defaultSentenceItems();

        const describeItems = Array.isArray((describe?.config as any)?.items)
          ? ((describe?.config as any).items as DescribeSeeItem[])
          : defaultDescribeItems();

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Level:</span>
              {(["easy", "medium", "hard"] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    level === lv
                      ? "border-teal-400 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "word_scramble",
                  "Scramble words",
                  "Unscramble letters and type the answer.",
                  "🧩",
                  "from-violet-400 via-fuchsia-400 to-pink-400",
                ],
                [
                  "sentence_correct",
                  "Is the sentence correct?",
                  "Decide whether each sentence is correct.",
                  "✅",
                  "from-emerald-400 via-teal-400 to-cyan-400",
                ],
                [
                  "describe_see",
                  "Describe what you see",
                  "Choose the best description for the prompt/image.",
                  "🖼️",
                  "from-amber-300 via-orange-300 to-rose-300",
                ],
                [
                  "word_search",
                  "Word search",
                  "Find hidden words in the letter grid.",
                  "🔎",
                  "from-sky-400 via-indigo-400 to-violet-400",
                ],
              ].map(([id, label, desc, icon, grad]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setSelectedGame(id as "word_scramble" | "sentence_correct" | "describe_see" | "word_search")
                  }
                  className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedGame === id
                      ? "border-teal-400 ring-2 ring-teal-200"
                      : "border-slate-200 hover:border-teal-200"
                  }`}
                >
                  <div className={`h-24 bg-gradient-to-r ${grad} p-3 text-white`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-2xl drop-shadow-sm">{icon}</p>
                      {selectedGame === id ? (
                        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                          Playing
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Arcade
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-bold tracking-wide">{label}</p>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs text-slate-500">{desc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Free
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          selectedGame === id
                            ? "bg-teal-100 text-teal-900"
                            : "bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-800"
                        }`}
                      >
                        {selectedGame === id ? "Open" : "Play"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!selectedGame ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-600">
                Choose a game above to load it.
              </div>
            ) : null}

            {selectedGame === "word_scramble" ? (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <WordScrambleGame
                  title={scramble?.title || "1) Scramble words"}
                  description={
                    scramble?.description ||
                    "Unscramble the letters. Admins can use vocabulary mode or custom letter boxes + answer."
                  }
                  words={
                    level === "hard"
                      ? scrambleWords.filter((w) => (scrambleAnswerSide === "bikol" ? w.bikol.length : w.english.length) >= 6)
                      : level === "medium"
                        ? scrambleWords.filter((w) => (scrambleAnswerSide === "bikol" ? w.bikol.length : w.english.length) >= 4)
                        : scrambleWords
                  }
                  answerSide={scrambleAnswerSide}
                  scrambleMode={(scramble?.config as any)?.scrambleMode}
                  customPuzzles={(scramble?.config as any)?.scramblePuzzles}
                  showHint={level !== "hard"}
                />
                {!scrambleWords.length && (scramble?.config as any)?.scrambleMode !== "custom" ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Admin tip: add words in <strong>Admin → Content → Vocabulary</strong>, or switch Scramble to{" "}
                    <strong>Custom letter boxes + answer</strong>.
                  </p>
                ) : null}
              </section>
            ) : null}

            {selectedGame === "sentence_correct" ? (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <SentenceCorrectGame
                  title={sentence?.title || "2) Is the sentence correct?"}
                  description={sentence?.description || "Choose if the sentence is correct or incorrect."}
                  items={sentenceItems}
                  maxItems={level === "hard" ? Math.min(12, sentenceItems.length) : level === "medium" ? Math.min(8, sentenceItems.length) : Math.min(5, sentenceItems.length)}
                />
              </section>
            ) : null}

            {selectedGame === "describe_see" ? (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <DescribeWhatYouSeeGame
                  title={describe?.title || "3) Describe what you see"}
                  description={describe?.description || "Pick the best description for the picture/prompt."}
                  items={describeItems}
                  maxItems={level === "hard" ? Math.min(8, describeItems.length) : level === "medium" ? Math.min(5, describeItems.length) : Math.min(3, describeItems.length)}
                />
              </section>
            ) : null}

            {selectedGame === "word_search" ? (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <WordSearchGame
                  title={search?.title || "4) Word search"}
                  description={search?.description || "Find hidden English words in the grid."}
                  words={searchWords}
                  wordCount={
                    level === "hard"
                      ? Math.min(12, Math.max(8, Number((search?.config as any)?.wordSearchCount) || 10))
                      : level === "medium"
                        ? Math.min(10, Math.max(6, Number((search?.config as any)?.wordSearchCount) || 8))
                        : Math.min(8, Math.max(4, Number((search?.config as any)?.wordSearchCount) || 6))
                  }
                  allowTyping={level !== "hard"}
                />
                {!searchWords.length ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Admin tip: add words in <strong>Admin → Content → Vocabulary</strong> (Word search uses vocabulary).
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        );
      })()}
    </div>
  );
}
