import type { LessonOut } from "./api";

export type LanguagePage = {
  label: string;
  definition: string;
  examples: string[];
  categories: { title: string; description: string }[];
};

const DEFAULT_LABELS = ["Naga Bicol", "Rinconada Bikol", "Filipino", "English"] as const;

export function normalizeLanguagePages(lesson: LessonOut): LanguagePage[] {
  const raw = lesson.languagePages;
  if (Array.isArray(raw) && raw.length > 0) {
    const pages = raw.map((p) => ({
      label: p.label || "Language",
      definition: p.definition || "",
      examples: Array.isArray(p.examples) ? p.examples : [],
      categories: Array.isArray(p.categories)
        ? p.categories.map((c) => ({
            title: c.title || "",
            description: c.description || "",
          }))
        : [],
    }));
    while (pages.length < 4) {
      const i = pages.length;
      pages.push({
        label: DEFAULT_LABELS[i] ?? `Part ${i + 1}`,
        definition: lesson.content?.trim() || "Content coming soon.",
        examples: [],
        categories: [],
      });
    }
    return pages.slice(0, 4);
  }

  const legacy = lesson.content?.trim() || "Content coming soon.";
  return DEFAULT_LABELS.map((label) => ({
    label,
    definition: legacy,
    examples: [],
    categories: [],
  }));
}

export function progressPercent(pageIndex: number, total: number) {
  return Math.round(((pageIndex + 1) / total) * 100);
}

/** Simple lessons: use stored slides, or legacy single `content` string. */
export function normalizeSimpleSlides(lesson: LessonOut): string[] {
  const raw = lesson.simpleSlides;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((s) => (typeof s === "string" ? s : String(s ?? "")));
  }
  const c = lesson.content;
  return [c != null && String(c).length > 0 ? String(c) : ""];
}
