import { useEffect, useMemo, useState } from "react";
import type { VocabWord } from "@/lib/api";

const GRID_SIZE = 12;
type Cell = { r: number; c: number };
type Placement = { word: string; cells: Cell[] };

function normalizeWord(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "");
}

function randomLetter(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function tryPlaceWord(grid: string[][], word: string): Placement | null {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { dr, dc } = directions[Math.floor(Math.random() * directions.length)];
    const rMax = dr === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
    const cMax = dc === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
    const r = Math.floor(Math.random() * (rMax + 1));
    const c = Math.floor(Math.random() * (cMax + 1));
    let ok = true;
    for (let i = 0; i < word.length; i += 1) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const cur = grid[rr][cc];
      if (cur !== "" && cur !== word[i]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    for (let i = 0; i < word.length; i += 1) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      grid[rr][cc] = word[i];
    }
    return {
      word,
      cells: Array.from({ length: word.length }, (_, i) => ({ r: r + dr * i, c: c + dc * i })),
    };
  }
  return null;
}

function buildGrid(words: string[]) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));
  const placed: Placement[] = [];
  words.forEach((word) => {
    const p = tryPlaceWord(grid, word);
    if (p) placed.push(p);
  });
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (!grid[r][c]) grid[r][c] = randomLetter();
    }
  }
  return { grid, placed };
}

function cellsToKey(cells: Cell[]): string {
  return cells.map((x) => `${x.r}:${x.c}`).join("|");
}

function lineCells(a: Cell, b: Cell): Cell[] {
  if (a.r !== b.r && a.c !== b.c) return [];
  const out: Cell[] = [];
  if (a.r === b.r) {
    const min = Math.min(a.c, b.c);
    const max = Math.max(a.c, b.c);
    for (let c = min; c <= max; c += 1) out.push({ r: a.r, c });
    return out;
  }
  const min = Math.min(a.r, b.r);
  const max = Math.max(a.r, b.r);
  for (let r = min; r <= max; r += 1) out.push({ r, c: a.c });
  return out;
}

export function WordSearchGame({
  title,
  description,
  words,
  wordCount,
  allowTyping = true,
}: {
  title?: string;
  description?: string;
  words: VocabWord[];
  wordCount: number;
  allowTyping?: boolean;
}) {
  const sourceWords = useMemo(() => {
    const unique = new Set<string>();
    const cleaned: string[] = [];
    for (const w of words) {
      const nw = normalizeWord(w.english);
      if (nw.length < 3 || nw.length > GRID_SIZE) continue;
      if (unique.has(nw)) continue;
      unique.add(nw);
      cleaned.push(nw);
      if (cleaned.length >= wordCount) break;
    }
    return cleaned;
  }, [words, wordCount]);

  const [seed, setSeed] = useState(0);
  const { grid, placed } = useMemo(() => buildGrid(sourceWords), [sourceWords, seed]);
  const [guess, setGuess] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [preview, setPreview] = useState<Cell[]>([]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setFound([]);
    setFoundPaths([]);
    setFeedback(null);
    setGuess("");
    setAnchor(null);
    setPreview([]);
    setElapsed(0);
  }, [seed, placed.length]);

  if (placed.length < 3) {
    return (
      <p className="text-sm text-slate-500">Need more vocabulary words to generate a word search.</p>
    );
  }

  const submitGuess = () => {
    const g = normalizeWord(guess);
    if (!g) return;
    if (found.includes(g)) {
      setFeedback("Already found.");
      return;
    }
    const hit = placed.find((p) => p.word === g);
    if (hit) {
      setFound((prev) => [...prev, g]);
      setFoundPaths((prev) => [...prev, cellsToKey(hit.cells)]);
      setFeedback("Nice! Word found.");
      setGuess("");
      return;
    }
    setFeedback("Not in this puzzle, try again.");
  };

  const done = found.length === placed.length;
  const points = found.length * 4;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const toggleCell = (cell: Cell) => {
    if (!anchor) {
      setAnchor(cell);
      setPreview([cell]);
      return;
    }
    const line = lineCells(anchor, cell);
    if (line.length < 2) {
      setAnchor(cell);
      setPreview([cell]);
      return;
    }
    const k = cellsToKey(line);
    const kr = cellsToKey([...line].reverse());
    const hit = placed.find((p) => {
      const pk = cellsToKey(p.cells);
      const pr = cellsToKey([...p.cells].reverse());
      return (pk === k || pr === k || pk === kr || pr === kr) && !found.includes(p.word);
    });
    if (hit) {
      setFound((prev) => [...prev, hit.word]);
      setFoundPaths((prev) => [...prev, cellsToKey(hit.cells)]);
      setFeedback(`Found: ${hit.word}`);
    } else {
      setFeedback("Not a target word. Try another line.");
    }
    setAnchor(null);
    setPreview([]);
  };

  const isPreviewCell = (r: number, c: number) => preview.some((x) => x.r === r && x.c === c);
  const isFoundCell = (r: number, c: number) =>
    foundPaths.some((path) => path.split("|").includes(`${r}:${c}`));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-[#efefef] shadow-sm">
      <div className="bg-rose-500 px-4 py-2 text-center text-3xl font-bold tracking-wide text-white">
        {title?.toUpperCase() || "WORD SEARCH"}
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-rose-300 bg-rose-400/80 px-4 py-2 text-white">
        <p className="text-xl font-semibold">{points} / {placed.length * 4}</p>
        <p className="text-xl font-semibold">⏱ {mm}:{ss}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold">{guess.trim().toUpperCase() || "----"}</p>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded bg-white/20 px-2 py-1 text-sm font-semibold hover:bg-white/30"
            title="New puzzle"
          >
            New
          </button>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[190px_1fr]">
        <aside className="border-r border-slate-300 bg-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-600">WORDS</p>
          <ul className="space-y-0.5 text-[13px] leading-5">
            {placed.map((w) => (
              <li
                key={w.word}
                className={`${found.includes(w.word) ? "font-semibold text-emerald-700 line-through" : "text-slate-800"}`}
              >
                {w.word}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-3">
          {description ? (
            <p className="mb-2 text-sm text-slate-600">{description}</p>
          ) : (
            <p className="mb-2 text-sm text-slate-600">Find words, type one, then press Check.</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white p-3">
            <div className="grid w-max grid-cols-12 gap-1">
              {grid.flatMap((row, r) =>
                row.map((ch, c) => (
                  <button
                    type="button"
                    key={`${r}-${c}`}
                    onClick={() => toggleCell({ r, c })}
                    className={`inline-flex h-9 w-9 items-center justify-center text-4xl font-medium uppercase sm:h-10 sm:w-10 ${
                      isFoundCell(r, c)
                        ? "rounded bg-emerald-200 text-emerald-900"
                        : isPreviewCell(r, c)
                          ? "rounded bg-amber-200 text-amber-900"
                          : "text-black hover:rounded hover:bg-slate-200"
                    }`}
                    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {ch}
                  </button>
                ))
              )}
            </div>
          </div>

          {allowTyping ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Type found word"
                onKeyDown={(e) => e.key === "Enter" && submitGuess()}
              />
              <button
                type="button"
                onClick={submitGuess}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Check
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Hard mode: find words by selecting letters only.</p>
          )}

          {feedback ? <p className="mt-2 text-sm text-slate-700">{feedback}</p> : null}
          {done ? <p className="mt-2 text-sm font-semibold text-emerald-700">Puzzle complete! Great work.</p> : null}
        </div>
      </div>
    </div>
  );
}
