import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

function moduleIdFromLesson(lesson: { moduleId: unknown }): string {
  const mod = lesson.moduleId;
  if (mod && typeof mod === "object" && "_id" in mod) return String((mod as { _id: string })._id);
  return String(mod);
}

/** Old URLs used `/lessons/:lessonId` — redirect to `/lessons/module/:moduleId/lesson/:lessonId`. */
export function LessonLegacyRedirect() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lessonId || lessonId === "module") {
      navigate("/lessons", { replace: true });
      return;
    }
    let cancelled = false;
    api
      .lesson(lessonId)
      .then((d) => {
        if (cancelled) return;
        const mid = moduleIdFromLesson(d.lesson);
        navigate(`/lessons/module/${mid}/lesson/${lessonId}`, { replace: true });
      })
      .catch(() => {
        if (!cancelled) navigate("/lessons", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, navigate]);

  return <p className="text-slate-500">Opening lesson…</p>;
}
