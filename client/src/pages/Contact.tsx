const researchers = [
  { name: "KRISTINE V. PRIELA", email: "kristinepriela04@gmail.com" },
  { name: "MERYLL C. CEA", email: "meryllcea8@gmail.com" },
  { name: "MONIC M. MALAPO", email: "meryllcea8@gmail.com" },
  { name: "SOPHIA AIRA JOY S. TIRAO", email: "sophiaairajoy@gmail.com" },
  { name: "RICALYN B. MEDINA", email: "ricalynmedina@gmail.com" },
  { name: "MIKAELA R. SANCHEZ", email: "mikaelasanchez@gmail.com" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Contact() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1
        className="text-3xl font-semibold text-slate-800 md:text-4xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        Contact
      </h1>

      <section className="glass rounded-2xl p-6 sm:p-8">
        <h2
          className="text-2xl font-semibold text-slate-800"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Meet the researchers!
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {researchers.map((r) => (
            <article key={r.name} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">
                  {initials(r.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">Bachelor of Secondary Education</p>
                  <p className="text-sm text-slate-600">Major in English</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-slate-800">E-MAIL ADDRESS: </span>
                    <a className="text-cyan-700 hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
