import { Link } from "react-router-dom";

export function Games() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1
          className="text-2xl font-semibold text-slate-800 sm:text-3xl md:text-4xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Games
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
          Tap a game to play. Use back on the game screen to return here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:gap-6">
        {[
          [
            "scramble",
            "Scramble words",
            "Unscramble letters and type the answer.",
            "/dist/Scrable-logo.png",
          ],
          [
            "sentence",
            "Is the sentence correct?",
            "Decide whether each sentence is correct.",
            "/dist/sentence-correct.png",
          ],
          [
            "describe",
            "Describe what you see",
            "Choose the best description for the prompt/image.",
            "/dist/describe-what-you-see.png",
          ],
          [
            "word-search",
            "Word search",
            "Find hidden words in the letter grid.",
            "/dist/wordsearch-logo.png",
          ],
        ].map(([slug, label, desc, logoSrc]) => (
          <Link
            key={slug}
            to={`/games/${slug}`}
            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-teal-200/80 hover:shadow-lg dark:border-slate-700/80 dark:bg-slate-900/70"
          >
            <div className="relative flex min-h-[12rem] flex-1 flex-col items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50/95 to-cyan-50/40 p-4 sm:min-h-[12.5rem] sm:p-4 md:min-h-[14rem] md:p-5 dark:border-slate-700/60 dark:from-slate-900/80 dark:to-slate-800/60">
              <span className="absolute right-2 top-2 rounded-full bg-slate-100/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 backdrop-blur-sm dark:bg-slate-700/90 dark:text-slate-300 sm:text-[10px]">
                Arcade
              </span>
              <div className="flex h-full w-full min-h-[10rem] max-h-[min(70vw,22rem)] items-center justify-center sm:max-h-[min(28vw,20rem)] md:max-h-[min(22vw,22rem)]">
                <img
                  src={logoSrc}
                  alt={label}
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3">
              <p className="line-clamp-2 text-center text-sm font-semibold leading-tight text-slate-900 sm:text-xs md:text-sm dark:text-slate-100">
                {label}
              </p>
              <p className="line-clamp-3 text-center text-xs leading-snug text-slate-500 sm:text-[10px] md:text-xs dark:text-slate-400">
                {desc}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  Free
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-800 sm:px-3 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-teal-900/40 dark:group-hover:text-teal-200">
                  Play
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

