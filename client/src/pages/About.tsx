export function About() {
  return (
    <div className="space-y-8">
      <h1
        className="text-3xl font-semibold text-slate-800 md:text-4xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        About LinguaFiRST
      </h1>
      <div className="max-w-2xl space-y-4 leading-relaxed text-slate-600">
        <p>
          <strong className="text-slate-900">LinguaFiRST</strong> is a focused learning space for moving
          between <strong className="text-teal-700">Bikol</strong> and{" "}
          <strong className="text-rose-600">English</strong>. Lessons are grouped into modules;
          quizzes reinforce patterns; vocabulary and games help recognition stick.
        </p>
        <p>
          Progress and notes are available when you sign in. The first registered account becomes an{" "}
          <strong className="text-slate-900">administrator</strong>, who can manage lessons, quizzes, and
          vocabulary through the HTTP API (ideal for CMS or internal tools).
        </p>
        <p className="text-sm text-slate-500">
          Analytics events (such as page views) are stored when you are logged in, to understand how
          features are used and improve the product.
        </p>
      </div>
    </div>
  );
}
