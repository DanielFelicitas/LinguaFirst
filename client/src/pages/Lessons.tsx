import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LessonFlipbook } from "@/components/LessonFlipbook";
import { SimpleLessonView } from "@/components/SimpleLessonView";
import { PaginationBar } from "@/components/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { api, type LessonOut, type ModuleOut, type ProgressOut } from "@/lib/api";
import { LESSON_MODULE_PAGE_SIZE, slicePage, totalPages } from "@/lib/pagination";
import { getGuestProgress, setGuestLesson } from "@/lib/guestProgress";
import { normalizeLanguagePages, normalizeSimpleSlides } from "@/lib/lessonPages";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

function lessonStatus(
  lessonId: string,
  progressList: ProgressOut[],
  guest: Record<string, { started?: boolean; completed?: boolean }>,
  isAuthed: boolean
): "done" | "progress" | "none" {
  if (isAuthed) {
    const p = progressList.find((x) => String(x.lessonId) === lessonId);
    if (p?.completed) return "done";
    if (p?.started) return "progress";
    return "none";
  }
  const g = guest[lessonId];
  if (g?.completed) return "done";
  if (g?.started) return "progress";
  return "none";
}

function moduleIdFromLesson(lesson: LessonOut): string {
  const mod = lesson.moduleId;
  if (mod && typeof mod === "object" && "_id" in mod) return String((mod as { _id: string })._id);
  return String(mod);
}

export function Lessons() {
  const { moduleId, lessonId } = useParams<{ moduleId?: string; lessonId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isModuleMap = !moduleId;
  const isModuleHub = !!moduleId && !lessonId;
  const isLessonRoute = !!moduleId && !!lessonId;

  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [progressList, setProgressList] = useState<ProgressOut[]>([]);
  const [guest, setGuest] = useState(() => getGuestProgress());
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [moduleListPage, setModuleListPage] = useState(1);

  const refreshGuest = useCallback(() => setGuest(getGuestProgress()), []);

  useEffect(() => {
    api
      .modules()
      .then((d) => setModules(d.modules))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .progress.list()
      .then((d) => setProgressList(d.progress))
      .catch(() => {});
  }, [user]);

  const sortedMods = useMemo(() => [...modules].sort((a, b) => a.order - b.order), [modules]);

  const activeModule = useMemo(() => {
    if (!moduleId) return null;
    return sortedMods.find((m) => m._id === moduleId) ?? null;
  }, [sortedMods, moduleId]);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setPageIndex(0);
      setErr(null);
      return;
    }
    setPageIndex(0);
    setLesson(null);
    setErr(null);
    let cancelled = false;
    api
      .lesson(lessonId)
      .then((d) => {
        if (cancelled) return;
        setLesson(d.lesson);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });

    if (user) {
      void api.progress.save({ lessonId, started: true }).then(async (d) => {
        setProgressList((prev) => {
          const i = prev.findIndex((p) => String(p.lessonId) === String(lessonId));
          const row = d.progress as ProgressOut;
          if (i < 0) return [...prev, row];
          const copy = [...prev];
          copy[i] = { ...copy[i], ...row };
          return copy;
        });
      });
    } else {
      setGuestLesson(lessonId, { started: true });
      refreshGuest();
    }
    return () => {
      cancelled = true;
    };
  }, [lessonId, user, refreshGuest]);

  useEffect(() => {
    if (!lesson || !lessonId || !moduleId) return;
    const mid = moduleIdFromLesson(lesson);
    if (mid !== moduleId) {
      navigate(`/lessons/module/${mid}/lesson/${lessonId}`, { replace: true });
    }
  }, [lesson, lessonId, moduleId, navigate]);

  const pages = useMemo(() => (lesson ? normalizeLanguagePages(lesson) : []), [lesson]);
  const simpleSlides = useMemo(() => (lesson ? normalizeSimpleSlides(lesson) : []), [lesson]);

  const activeModuleId = useMemo(() => {
    if (lesson) return moduleIdFromLesson(lesson);
    if (moduleId) return moduleId;
    return null;
  }, [lesson, moduleId]);

  const modListTotalPages = useMemo(
    () => totalPages(sortedMods.length, LESSON_MODULE_PAGE_SIZE),
    [sortedMods.length]
  );

  useEffect(() => {
    setModuleListPage((p) => Math.min(p, modListTotalPages));
  }, [modListTotalPages]);

  useEffect(() => {
    if (!activeModuleId || sortedMods.length === 0) return;
    const idx = sortedMods.findIndex((m) => m._id === activeModuleId);
    if (idx < 0) return;
    setModuleListPage(Math.floor(idx / LESSON_MODULE_PAGE_SIZE) + 1);
  }, [activeModuleId, sortedMods]);

  const modsOnPage = useMemo(
    () => slicePage(sortedMods, moduleListPage, LESSON_MODULE_PAGE_SIZE),
    [sortedMods, moduleListPage]
  );

  const onMarkDone = async () => {
    if (!lessonId || !lesson) return;
    if (user) {
      await api.progress.save({ lessonId, completed: true });
      const { progress } = await api.progress.list();
      setProgressList(progress);
    } else {
      setGuestLesson(lessonId, { completed: true });
      refreshGuest();
    }
  };

  const isSimpleLesson = lesson?.lessonType === "simple";
  const canMarkDone = isSimpleLesson
    ? simpleSlides.length <= 1 || pageIndex >= simpleSlides.length - 1
    : pageIndex >= pages.length - 1 && pages.length > 0;

  const selectLesson = (id: string) => {
    if (!moduleId) return;
    navigate(`/lessons/module/${moduleId}/lesson/${id}`);
  };

  if (loading) {
    return <p className="text-slate-500">Loading lessons…</p>;
  }
  if (err && !lessonId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        {err}
      </div>
    );
  }
  if (err && lessonId && !lesson) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{err}</div>
        {moduleId ? (
          <Link to={`/lessons/module/${moduleId}`} className="font-medium text-teal-700 hover:underline">
            ← Back to module
          </Link>
        ) : (
          <Link to="/lessons" className="font-medium text-teal-700 hover:underline">
            ← All modules
          </Link>
        )}
      </div>
    );
  }
  if (moduleId && !activeModule) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
        <p className="text-slate-700">We couldn’t find that module.</p>
        <Link to="/lessons" className="font-medium text-teal-700 hover:underline">
          ← Back to all modules
        </Link>
      </div>
    );
  }

  /** Module map only: /lessons */
  if (isModuleMap) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 lg:max-w-4xl">
        <div>
          <h1
            className="text-2xl font-semibold text-slate-800 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Lessons
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Choose a module to open its lessons. You can return here anytime.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Your map
          </h2>
          <nav className="space-y-3" aria-label="Modules">
            {modsOnPage.map((m) => (
              <Link
                key={m._id}
                to={`/lessons/module/${m._id}`}
                className="block rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <p className="font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {m.title}
                </p>
                {m.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.description}</p> : null}
                <p className="mt-2 text-xs font-medium text-teal-700">Open module →</p>
              </Link>
            ))}
          </nav>
          <PaginationBar
            page={moduleListPage}
            pageSize={LESSON_MODULE_PAGE_SIZE}
            totalItems={sortedMods.length}
            onPageChange={setModuleListPage}
            className="mt-4"
          />
          {modules.length === 0 ? (
            <p className="text-sm text-slate-500">
              No modules yet. Run the seed script or add content as admin.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  /** Module hub or lesson reader: /lessons/module/:moduleId/... */
  const mod = activeModule!;
  const lessonsSorted = [...mod.lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="flex min-h-[min(85vh,calc(100vh-6rem))] flex-col gap-4 px-4 sm:px-5 lg:flex-row lg:items-start lg:gap-4 lg:px-6 xl:px-8">
      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[min(100%,16.5rem)] lg:min-w-[16rem] lg:max-w-[18rem] lg:self-start lg:py-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-5 lg:p-5">
          <Link
            to="/lessons"
            className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-teal-800 hover:underline dark:text-teal-200"
          >
            <span aria-hidden>←</span>
            All modules
          </Link>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            This module
          </h2>
          <nav className="space-y-3" aria-label="Lessons in module">
            <div
              className={`rounded-2xl bg-white/90 p-3 shadow-sm ${
                isLessonRoute ? "border-[3px] border-teal-500 ring-2 ring-teal-200/80" : "border border-slate-200"
              }`}
            >
              <p className="font-semibold text-slate-900" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                {mod.title}
              </p>
              {mod.description ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{mod.description}</p> : null}
              <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {lessonsSorted.map((l) => {
                  const st = lessonStatus(l._id, progressList, guest, !!user);
                  const isCurrent = lessonId === l._id;
                  return (
                    <li key={l._id}>
                      <button
                        type="button"
                        onClick={() => selectLesson(l._id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                          isCurrent ? "bg-teal-50 font-medium text-teal-900" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        {st === "done" ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
                            <CheckIcon className="h-3 w-3" />
                            Done
                          </span>
                        ) : st === "progress" ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                            <HourglassIcon className="h-3 w-3" />
                            In progress
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1 pb-8 lg:flex lg:flex-col lg:pb-10 lg:pt-6">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6 lg:min-h-0 lg:p-7 xl:p-8">
          {isModuleHub ? (
            <div className="space-y-3 py-4 text-center sm:py-8">
              <p className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                {mod.title}
              </p>
              <p className="text-sm text-slate-600">
                Pick a lesson from the list {lessonsSorted.length > 0 ? "on the left" : ""} to start reading.
              </p>
              {lessonsSorted.length > 0 ? (
                <div className="mx-auto mt-6 max-w-sm space-y-2 text-left lg:hidden">
                  {lessonsSorted.map((l) => (
                    <button
                      key={l._id}
                      type="button"
                      onClick={() => selectLesson(l._id)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-teal-300 hover:bg-teal-50/50"
                    >
                      {l.title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No lessons in this module yet.</p>
              )}
            </div>
          ) : !lesson && lessonId ? (
            <p className="text-slate-500">Loading lesson…</p>
          ) : lesson ? (
            <>
              {isLessonRoute ? (
                <div className="mb-4 border-b border-slate-100 pb-4 dark:border-slate-700">
                  <Link
                    to={`/lessons/module/${moduleId}`}
                    className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-teal-800 hover:underline dark:text-teal-200"
                  >
                    <span aria-hidden>←</span>
                    Back to module
                  </Link>
                </div>
              ) : null}
              {isSimpleLesson ? (
                <SimpleLessonView
                  lessonTitle={lesson.title}
                  slides={simpleSlides}
                  pageIndex={pageIndex}
                  onPageChange={setPageIndex}
                  markDoneSlot={
                    <button
                      id="mark-lesson-done-btn"
                      type="button"
                      disabled={!canMarkDone}
                      onClick={() => void onMarkDone()}
                      title={
                        canMarkDone
                          ? "Mark this lesson complete"
                          : simpleSlides.length > 1
                            ? "Go to the last slide to unlock"
                            : "Mark this lesson complete"
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        canMarkDone
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:brightness-105"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      Mark as done
                    </button>
                  }
                />
              ) : (
                <LessonFlipbook
                  lessonTitle={lesson.title}
                  pages={pages}
                  pageIndex={pageIndex}
                  onPageChange={setPageIndex}
                  markDoneSlot={
                    <button
                      id="mark-lesson-done-btn"
                      type="button"
                      disabled={!canMarkDone}
                      onClick={() => void onMarkDone()}
                      title={
                        canMarkDone
                          ? "Mark this lesson complete"
                          : "Read through all four languages (through English) to unlock"
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        canMarkDone
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:brightness-105"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      Mark as done
                    </button>
                  }
                />
              )}
            </>
          ) : (
            <p className="text-slate-500">Pick a lesson from the list.</p>
          )}

          {lesson && !user ? (
            <p className="mt-6 text-xs text-slate-500">
              <Link to="/login" className="text-teal-600 hover:underline">
                Sign in
              </Link>{" "}
              to sync progress across devices.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
