const KEY = "lf_quiz_results";

export type StoredQuizResult = {
  correct: number;
  total: number;
  pct: number;
  at: string;
};

function readMap(): Record<string, StoredQuizResult> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, StoredQuizResult>)
      : {};
  } catch {
    return {};
  }
}

export function saveQuizResult(quizId: string, correct: number, total: number, pct: number) {
  try {
    const map = readMap();
    map[quizId] = {
      correct,
      total,
      pct,
      at: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getQuizResult(quizId: string): StoredQuizResult | null {
  const map = readMap();
  const r = map[quizId];
  if (!r || typeof r.correct !== "number" || typeof r.total !== "number") return null;
  return r;
}
