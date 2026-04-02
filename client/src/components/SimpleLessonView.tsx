import { type ReactNode, useEffect, useRef } from "react";
import { progressPercent } from "@/lib/lessonPages";

export function SimpleLessonView({
  lessonTitle,
  slides,
  pageIndex,
  onPageChange,
  markDoneSlot,
}: {
  lessonTitle: string;
  slides: string[];
  pageIndex: number;
  onPageChange: (i: number) => void;
  markDoneSlot: ReactNode;
}) {
  const total = slides.length;
  const safeIndex = Math.min(Math.max(0, pageIndex), Math.max(0, total - 1));
  const body = slides[safeIndex];
  const pct = total > 0 ? progressPercent(safeIndex, total) : 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [safeIndex]);

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
        <div className="transition-opacity duration-150" key={safeIndex}>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-600">
            Slide {safeIndex + 1} of {total}
          </p>

          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs text-slate-500">{pct}%</p>
          </div>

          <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
            {body?.trim() ? body : "No content on this slide yet."}
          </div>
        </div>
      </div>

      {total > 1 ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 mt-auto flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-20 lg:px-0"
          aria-label="Lesson slides"
        >
          <div className="min-w-[5.5rem]">
            {safeIndex > 0 ? (
              <button
                type="button"
                onClick={() => onPageChange(safeIndex - 1)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Back
              </button>
            ) : (
              <div className="h-10" aria-hidden />
            )}
          </div>
          <p className="hidden flex-1 text-center text-xs text-slate-400 sm:block">
            Step through each slide — mark done on the last one
          </p>
          <div className="min-w-[5rem] text-right">
            {safeIndex < total - 1 ? (
              <button
                type="button"
                onClick={() => onPageChange(safeIndex + 1)}
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
      ) : null}
    </div>
  );
}
