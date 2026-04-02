/** Minimum correct ratio to count as a pass (e.g. 0.7 = 70%). */
export const GAME_PASS_THRESHOLD = 0.7;

type Props = {
  score: number;
  total: number;
  /** If omitted, pass = score / total >= GAME_PASS_THRESHOLD */
  pass?: boolean;
  onPlayAgain?: () => void;
};

export function GameCompletionSummary({ score, total, pass: passProp, onPlayAgain }: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const pass = passProp ?? (total > 0 && score / total >= GAME_PASS_THRESHOLD);

  return (
    <div
      className={`rounded-2xl border-2 p-8 text-center shadow-lg ${
        pass
          ? "border-teal-300 bg-gradient-to-b from-teal-50 via-emerald-50/80 to-white dark:border-teal-700 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-slate-900"
          : "border-amber-200 bg-gradient-to-b from-amber-50/90 to-white dark:border-amber-800 dark:from-amber-950/40 dark:to-slate-900"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-4xl" aria-hidden>
        {pass ? "🎉" : "📚"}
      </div>
      <h3
        className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        {pass ? "Congratulations!" : "Session complete"}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {pass ? "You passed this round." : "Keep practicing — aim for 70% or higher to pass."}
      </p>
      <p className="mt-6 text-4xl font-bold tabular-nums text-teal-700 dark:text-teal-300">
        {score}
        <span className="text-2xl font-semibold text-slate-400"> / </span>
        {total}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-300">{pct}%</p>
      {onPlayAgain ? (
        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-8 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          Play again
        </button>
      ) : null}
    </div>
  );
}
