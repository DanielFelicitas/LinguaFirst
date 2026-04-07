/** Order: first → last. Photo filenames match `client/public/dist/photos/`. */
const researchers = [
  { name: "CEA, MERYLL C. ", email: "meryllcea8@gmail.com", photo: "/dist/photos/meryllcea.png" },
  { name: "MALAPO, MONIC M. ", email: "monicmalapo523@gmail.com", photo: "/dist/photos/MONIC.jpg" },
  { name: "MEDINA, RICALYN B. ", email: "ricalynmedina@gmail.com", photo: "/dist/photos/ricalynmedina.png" },
  { name: "PRIELA, KRISTINE V. ", email: "kristinepriela04@gmail.com", photo: "/dist/photos/kristinepriela.jpg" },
  { name: "SANCHEZ, MIKAELA R. ", email: "mikaelasanchez@gmail.com", photo: "/dist/photos/mikaelasanchez.png" },
  { name: "TIRAO, SOPHIA AIRA JOY S. ", email: "sophiaairajoy@gmail.com", photo: "/dist/photos/sophiaairajoy.jpg" },
];

export function Contact() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <h1
        className="text-2xl font-semibold text-slate-800 sm:text-3xl md:text-4xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        Contact
      </h1>

      <section className="glass rounded-2xl p-4 sm:p-8">
        <h2
          className="text-xl font-semibold text-slate-800 sm:text-2xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Meet the Researchers
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
          {researchers.map((r) => (
            <article
              key={r.name}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-6"
            >
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm sm:h-40 sm:w-40">
                  <img
                    src={r.photo}
                    alt={r.name}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 w-full max-w-md sm:max-w-none">
                  <h3 className="text-balance font-semibold leading-snug text-slate-900">{r.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">Bachelor of Secondary Education</p>
                  <p className="text-sm text-slate-600">Major in English</p>
                  <p className="mt-3 text-sm leading-relaxed">
                    <span className="font-medium text-slate-800">E-MAIL ADDRESS: </span>
                    <a
                      className="inline-block max-w-full break-all text-cyan-700 underline-offset-2 hover:underline sm:break-words"
                      href={`mailto:${r.email}`}
                    >
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
