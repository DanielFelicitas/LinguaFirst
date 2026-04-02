export function About() {
  return (
    <div className="space-y-8">
      <h1
        className="text-4xl font-semibold text-slate-800 md:text-5xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        About LinguaFiRST
      </h1>
      <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-slate-600 md:text-xl">
        <p>
          LinguaFirst is designed to support students in learning English through a step-by-step
          language approach. Many learners in Camarines Sur speak Naga Bicol or Rinconada Bikol in
          their daily lives. These languages are an important part of their identity and
          communication.
        </p>
        <p>
          Instead of ignoring these local languages, LinguaFirst values them as a starting point for
          learning. Students begin with familiar words and ideas in their local language. From there,
          they gradually connect these ideas to Filipino and then to English.
        </p>
        <p>
          This approach helps learners understand lessons more easily because they can relate new
          knowledge to what they already know. It also helps students feel more confident while
          learning a new language. Through lessons, activities, games, and stories, LinguaFirst
          encourages students to explore language in a fun and meaningful way.
        </p>
      </div>
    </div>
  );
}
