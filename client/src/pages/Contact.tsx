export function Contact() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1
        className="text-3xl font-semibold text-slate-800 md:text-4xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        Contact
      </h1>
      <p className="text-slate-600">
        LinguaFiRST is built for learners and educators. For partnerships, content contributions, or
        feedback about Bikol orthography and examples, reach out through your institution or project
        channels.
      </p>
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">Email (placeholder)</span>
          <br />
          <span className="text-slate-500">hello@linguafirst.example</span>
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Replace this block with your real contact details or connect a form backend when ready.
        </p>
      </div>
    </div>
  );
}
