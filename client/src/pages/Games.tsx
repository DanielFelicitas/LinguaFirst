import { Link } from "react-router-dom";

export function Games() {
  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-semibold text-slate-800 md:text-4xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Games
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Click a game tile to open a dedicated game page.
        </p>
      </div>

      <div className="space-y-4">
        {[
          [
            "scramble",
            "Scramble words",
            "Unscramble letters and type the answer.",
            "🧩",
            "from-violet-400 via-fuchsia-400 to-pink-400",
          ],
          [
            "sentence",
            "Is the sentence correct?",
            "Decide whether each sentence is correct.",
            "✅",
            "from-emerald-400 via-teal-400 to-cyan-400",
          ],
          [
            "describe",
            "Describe what you see",
            "Choose the best description for the prompt/image.",
            "🖼️",
            "from-amber-300 via-orange-300 to-rose-300",
          ],
          [
            "word-search",
            "Word search",
            "Find hidden words in the letter grid.",
            "🔎",
            "from-sky-400 via-indigo-400 to-violet-400",
          ],
        ].map(([slug, label, desc, icon, grad]) => (
          <Link
            key={slug}
            to={`/games/${slug}`}
            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
          >
            <div className={`h-24 bg-gradient-to-r ${grad} p-3 text-white`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-2xl drop-shadow-sm">{icon}</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Arcade
                </span>
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-bold tracking-wide">{label}</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-500">{desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Free</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-800">
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

