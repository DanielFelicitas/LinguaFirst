import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function resolveGameType(
  key: string | undefined
): "word_scramble" | "sentence_correct" | "describe_see" | "word_search" | null {
  if (key === "scramble") return "word_scramble";
  if (key === "sentence") return "sentence_correct";
  if (key === "describe") return "describe_see";
  if (key === "word-search") return "word_search";
  return null;
}

export function GamePlay() {
  const { gameKey } = useParams<{ gameKey: string }>();
  const type = resolveGameType(gameKey);

  const [games, setGames] = useState<GameOut[]>([]);
  const [wordsByKey, setWordsByKey] = useState<Record<string, VocabWord[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  if (!type) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        Unknown game.
      </div>
    );
  }
  if (loading) return <p className="text-slate-500">Loading game…</p>;
  if (err) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{err}</div>;

  const fallbackWords = wordsByKey["__all__"] || [];
  const game = pickFirst(games, type);

  const tag = game?.config?.vocabularyTag?.trim();
  const key = tag || "__all__";
  const words = wordsByKey[key] || fallbackWords;

  const sentenceItems = Array.isArray((game?.config as any)?.items)
    ? ((game?.config as any).items as SentenceCorrectItem[])
    : defaultSentenceItems();
  const describeItems = Array.isArray((game?.config as any)?.items)
    ? ((game?.config as any).items as DescribeSeeItem[])
    : defaultDescribeItems();

  const scrambleWordsFiltered = words.filter((w) => w.english.length >= 4);
  const scrambleWords = scrambleWordsFiltered.length > 0 ? scrambleWordsFiltered : words;
  const sentenceMax = Math.min(8, sentenceItems.length);
  const describeMax = Math.min(5, describeItems.length);
  const wordSearchCfg = game?.config as { wordSearchCount?: number } | undefined;
  const wordSearchCount = Math.min(
    10,
    Math.max(6, Number(wordSearchCfg?.wordSearchCount) || 8)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          to="/games"
          className="inline-flex w-full min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-teal-200/90 bg-teal-50/90 px-4 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-100/90 sm:w-auto sm:min-h-0 sm:justify-start sm:border-0 sm:bg-transparent sm:px-0 sm:font-medium sm:shadow-none sm:hover:bg-transparent sm:hover:underline"
        >
          <span aria-hidden>←</span>
          <span>All games</span>
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        {type === "word_scramble" ? (
          <WordScrambleGame
            title={game?.title || "Scramble words"}
            description={game?.description || "Unscramble the letters."}
            words={scrambleWords}
            answerSide={game?.config?.answerSide === "english" ? "english" : "bikol"}
            scrambleMode={(game?.config as any)?.scrambleMode}
            customPuzzles={(game?.config as any)?.scramblePuzzles}
            showHint
          />
        ) : null}

        {type === "sentence_correct" ? (
          <SentenceCorrectGame
            title={game?.title || "Is the sentence correct?"}
            description={game?.description || "Choose if the sentence is correct or incorrect."}
            items={sentenceItems}
            maxItems={sentenceMax}
          />
        ) : null}

        {type === "describe_see" ? (
          <DescribeWhatYouSeeGame
            title={game?.title || "Describe what you see"}
            description={game?.description || "Pick the best description."}
            items={describeItems}
            maxItems={describeMax}
          />
        ) : null}

        {type === "word_search" ? (
          <WordSearchGame
            title={game?.title || "Word search"}
            description={game?.description || "Find hidden words in the grid."}
            words={words}
            wordCount={wordSearchCount}
            allowTyping
          />
        ) : null}
      </section>
    </div>
  );
}

