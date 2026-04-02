const KEY = "lf_guest_lesson_progress";

export type GuestLessonState = { started?: boolean; completed?: boolean };

export function getGuestProgress(): Record<string, GuestLessonState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, GuestLessonState>;
  } catch {
    return {};
  }
}

export function setGuestLesson(lessonId: string, patch: GuestLessonState) {
  const all = { ...getGuestProgress() };
  all[lessonId] = { ...all[lessonId], ...patch };
  localStorage.setItem(KEY, JSON.stringify(all));
}
