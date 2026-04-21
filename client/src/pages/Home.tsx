import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-teal-600">
          <b>Bikol ↔ Filipino ↔ English</b>
        </p>
        <h1
          className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-slate-800 sm:text-5xl md:text-6xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          <span className="text-green-700"><b>LinguaFiRST</b></span>
          <span className="mt-2 block text-slate-700">Learn at your pace</span>
          <span className="mt-2 block text-slate-700">Speak with pride</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Structured lessons, quick quizzes, vocabulary, and light games — built for learners who
          want a clear path between Bikol and English.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/lessons"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-300 via-amber-200 to-teal-300 px-8 py-3 text-base font-semibold text-slate-800 shadow-lg shadow-rose-200/40 transition hover:brightness-[1.03]"
          >
            Start learning
          </Link>
          <Link
            to="/games"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Try a game
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Modules & lessons",
            body: "Follow themed modules with bite-sized lessons you can revisit anytime.",
            to: "/lessons",
          },
          {
            title: "Quizzes",
            body: "The Quiz page lists everything available. Finish a run to see your score and a question-by-question review.",
            to: "/quiz",
          },
          {
            title: "Games & vocab",
            body: "Match pairs and explore a growing word list in both languages.",
            to: "/games",
          },
        ].map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="glass group rounded-2xl p-6 transition hover:border-teal-200 hover:shadow-md hover:shadow-teal-100"
          >
            <h2
              className="text-lg font-semibold text-slate-800 group-hover:text-teal-700"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
            <span className="mt-4 inline-block text-sm font-medium text-rose-600">
              Explore →
            </span>
          </Link>
        ))}
      </section>

      <section className="glass rounded-3xl border-amber-100 bg-amber-50/40 p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-semibold text-slate-800 md:text-3xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Track progress &amp; notes
          </h2>
          <p className="mt-4 text-slate-600">
            Create an account to save notes, mark lessons complete, and help us improve the
            experience with usage insights.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-xl border border-rose-200 bg-white px-6 py-2.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
          >
            Create free account
          </Link>
        </div>
      </section>
    </div>
  );
}
