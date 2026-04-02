import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PaginationBar } from "@/components/PaginationBar";
import {
  api,
  MODULE_TYPE_OPTIONS,
  type ModuleOut,
  type ModuleType,
  type QuizOut,
} from "@/lib/api";
import { getQuizResult } from "@/lib/quizScores";
import { CONTENT_PAGE_SIZE, slicePage, totalPages } from "@/lib/pagination";

type QuizCategoryFilter = "all" | ModuleType | "uncategorized";

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M9 12h6m-6 4h4M9 8h2M7 4h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function moduleTypeLabel(t: ModuleType | undefined): string {
  return MODULE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "General";
}

function buildModuleMap(modules: ModuleOut[]) {
  const r: Record<string, ModuleOut> = {};
  modules.forEach((m) => {
    r[String(m._id)] = m;
  });
  return r;
}

function filterQuizzesByCategory(
  quizzes: QuizOut[],
  modulesById: Record<string, ModuleOut>,
  key: QuizCategoryFilter
): QuizOut[] {
  if (key === "all") return quizzes;
  if (key === "uncategorized") {
    return quizzes.filter((q) => {
      const id = q.moduleId ? String(q.moduleId) : "";
      return !id || !modulesById[id];
    });
  }
  return quizzes.filter((q) => {
    const id = q.moduleId ? String(q.moduleId) : "";
    if (!id) return false;
    const m = modulesById[id];
    if (!m) return false;
    const t = m.moduleType ?? "general";
    return t === key;
  });
}

export function QuizHub() {
  const [quizzes, setQuizzes] = useState<QuizOut[]>([]);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizPage, setQuizPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<QuizCategoryFilter>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [quizRes, modRes] = await Promise.all([api.quizzes(), api.modules()]);
        if (cancelled) return;
        setQuizzes(quizRes.quizzes);
        setModules(modRes.modules);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modulesById = useMemo(() => buildModuleMap(modules), [modules]);

  const uncategorizedCount = useMemo(
    () =>
      quizzes.filter((q) => {
        const id = q.moduleId ? String(q.moduleId) : "";
        return !id || !modulesById[id];
      }).length,
    [quizzes, modulesById]
  );

  const filteredQuizzes = useMemo(
    () => filterQuizzesByCategory(quizzes, modulesById, categoryFilter),
    [quizzes, modulesById, categoryFilter]
  );

  const n = filteredQuizzes.length;
  const quizTotalPages = totalPages(n, CONTENT_PAGE_SIZE);

  useEffect(() => {
    setQuizPage((p) => Math.min(p, quizTotalPages));
  }, [quizTotalPages]);

  useEffect(() => {
    setQuizPage(1);
  }, [categoryFilter]);

  const pagedQuizzes = useMemo(
    () => slicePage(filteredQuizzes, quizPage, CONTENT_PAGE_SIZE),
    [filteredQuizzes, quizPage]
  );

  const filterLabel =
    categoryFilter === "all"
      ? "All tracks"
      : categoryFilter === "uncategorized"
        ? "Uncategorized"
        : moduleTypeLabel(categoryFilter);

  if (loading) return <p className="text-slate-500">Loading quizzes…</p>;
  if (err)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{err}</div>
    );

  const totalQuizzes = quizzes.length;

  return (
    <div className="space-y-8">
      {totalQuizzes > 0 ? (
        <div className="space-y-6">
          <h1
            className="text-3xl font-semibold text-slate-800 md:text-4xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Quizzes
          </h1>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Category</h2>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter quizzes by module type">
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  categoryFilter === "all"
                    ? "border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                All
              </button>
              {MODULE_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === value}
                  onClick={() => setCategoryFilter(value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    categoryFilter === value
                      ? "border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
              {uncategorizedCount > 0 ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === "uncategorized"}
                  onClick={() => setCategoryFilter("uncategorized")}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    categoryFilter === "uncategorized"
                      ? "border-amber-400 bg-amber-50 text-amber-950 ring-1 ring-amber-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  Uncategorized ({uncategorizedCount})
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Showing <strong className="text-slate-700">{filterLabel}</strong>
              {categoryFilter !== "all" ? ` · ${n} quiz${n === 1 ? "" : "zes"}` : null}
            </p>
          </div>

          <div>
            {n === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-slate-600">
                <p>No quizzes in this category yet.</p>
                <p className="mt-2 text-sm text-slate-500">Try another category or ask an admin to link a quiz to a module.</p>
              </div>
            ) : (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {pagedQuizzes.map((q) => {
                    const last = getQuizResult(q._id);
                    const typeLabel = q.quizType === "true_false" ? "True / false" : "Multiple choice";
                    const mid = q.moduleId ? String(q.moduleId) : "";
                    const mod = mid ? modulesById[mid] : undefined;
                    const catLabel = mod
                      ? moduleTypeLabel(mod.moduleType ?? "general")
                      : "Uncategorized";
                    return (
                      <li key={q._id}>
                        <Link
                          to={`/quiz/${q._id}`}
                          className="glass group flex h-full flex-col rounded-2xl p-5 transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-100/50"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                              <QuizIcon className="h-6 w-6" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-900 group-hover:text-teal-800">{q.title}</span>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
                                  {catLabel}
                                  {mod?.title ? ` · ${mod.title}` : ""}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                  {q.questions.length} questions
                                </span>
                                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                                  {typeLabel}
                                </span>
                              </div>
                              {last ? (
                                <p className="mt-3 text-sm text-slate-600">
                                  Last score:{" "}
                                  <span className="font-semibold text-slate-900">
                                    {last.correct}/{last.total}
                                  </span>{" "}
                                  <span className="text-teal-700">({last.pct}%)</span>
                                </p>
                              ) : (
                                <p className="mt-3 text-sm text-slate-500">Not taken yet — tap to start</p>
                              )}
                            </div>
                            <span className="shrink-0 text-teal-600 opacity-70 transition group-hover:opacity-100" aria-hidden>
                              →
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <PaginationBar
                  page={quizPage}
                  pageSize={CONTENT_PAGE_SIZE}
                  totalItems={n}
                  onPageChange={setQuizPage}
                  className="mt-4"
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1
            className="text-3xl font-semibold text-slate-800 md:text-4xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Quizzes
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            When your teacher adds quizzes, they will appear here. Check back later or explore lessons and games.
          </p>
          <p className="mt-4 text-slate-500">No quizzes yet. Seed the database or add content as admin.</p>
        </div>
      )}
    </div>
  );
}
