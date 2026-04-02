import { type ReactNode, useEffect, useRef } from "react";
import type { LanguagePage } from "@/lib/lessonPages";
import { progressPercent } from "@/lib/lessonPages";

export function LessonFlipbook({
  lessonTitle,
  pages,
  pageIndex,
  onPageChange,
  markDoneSlot,
}: {
  lessonTitle: string;
  pages: LanguagePage[];
  pageIndex: number;
  onPageChange: (i: number) => void;
  markDoneSlot: ReactNode;
}) {
  const total = pages.length;
  const page = pages[pageIndex];
  const pct = total > 0 ? progressPercent(pageIndex, total) : 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pageIndex]);

  if (!page || total === 0) {
    return (
      <div>
        <header className="mb-4 border-b border-slate-200 pb-4">
          <h1
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {lessonTitle}
          </h1>
        </header>
        <p className="text-slate-600">
          No lesson pages to show. Add <code className="rounded bg-slate-100 px-1 text-sm">languagePages</code>{" "}
          or <code className="rounded bg-slate-100 px-1 text-sm">content</code> for this lesson.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(70vh,52rem)] flex-1 flex-col pb-24 lg:pb-0">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <h1
          className="text-xl font-bold text-slate-900 sm:text-2xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          {lessonTitle}
        </h1>
        <div id="mark-lesson-done" className="shrink-0">
          {markDoneSlot}
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="transition-opacity duration-150" key={pageIndex}>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-600">
            {pageIndex + 1} of {total}
          </p>
          <h2
            className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {page.label}
          </h2>

          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs text-slate-500">{pct}%</p>
          </div>

          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              What is it?
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
              {page.definition}
            </p>
          </section>

          {page.examples.length > 0 ? (
            <section className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Examples
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
                {page.examples.map((ex, i) => (
                  <li key={i} className="leading-relaxed">
                    {ex}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {page.categories.length > 0 ? (
            <section className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Types / categories
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {page.categories.map((cat, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-rose-50/50 p-4 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900">{cat.title}</p>
                    {cat.description ? (
                      <p className="mt-1 text-sm text-slate-600">{cat.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 mt-auto flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-20 lg:px-0"
        aria-label="Lesson pages"
      >
        <div className="min-w-[5.5rem]">
          {pageIndex > 0 ? (
            <button
              type="button"
              onClick={() => onPageChange(pageIndex - 1)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </button>
          ) : (
            <div className="h-10" aria-hidden />
          )}
        </div>
        <p className="hidden flex-1 text-center text-xs text-slate-400 sm:block">
          Digital flipbook — each step fills the bar
        </p>
        <div className="min-w-[5rem] text-right">
          {pageIndex < total - 1 ? (
            <button
              type="button"
              onClick={() => onPageChange(pageIndex + 1)}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                document.getElementById("mark-lesson-done-btn")?.focus();
                document.getElementById("mark-lesson-done-btn")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className="rounded-xl bg-gradient-to-r from-rose-400 via-amber-300 to-teal-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:brightness-105"
            >
              Finish
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
