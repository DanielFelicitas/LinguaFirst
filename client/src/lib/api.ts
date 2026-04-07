/**
 * API origin for fetch (no trailing slash, no `/api` suffix — paths already include `/api/...`).
 * Empty in dev = Vite proxies `/api` → local server.
 * In production builds, empty = browser calls the **frontend** host → `/api` 404 unless you set `VITE_API_URL` and redeploy.
 */
function getApiBase(): string {
  let raw = (import.meta.env.VITE_API_URL ?? "").trim();
  raw = raw.replace(/\/+$/, "");
  if (raw.endsWith("/api")) raw = raw.slice(0, -4).replace(/\/+$/, "");
  if (import.meta.env.PROD && !raw && typeof window !== "undefined") {
    console.error(
      "[LinguaFiRST] Set VITE_API_URL in the frontend Vercel project to your API URL (e.g. https://your-api.vercel.app), no trailing slash. Redeploy after saving — Vite bakes this in at build time."
    );
  }
  return raw;
}

const base = getApiBase();

export function getToken(): string | null {
  return localStorage.getItem("lf_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("lf_token", token);
  else localStorage.removeItem("lf_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers: h, ...rest } = options;
  const headers = new Headers(h);
  headers.set("Content-Type", "application/json");
  const t = token !== undefined ? token : getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${base}${path}`, { ...rest, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: string }).message)
        : res.statusText;
    throw new Error(msg || "Request failed");
  }
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/api/health"),

  register: (body: { email: string; password: string; displayName?: string }) =>
    request<{ token: string; user: UserOut }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      token: null,
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: UserOut }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      token: null,
    }),

  me: () => request<{ user: UserOut }>("/api/auth/me"),

  modules: () => request<{ modules: ModuleOut[] }>("/api/modules"),

  lesson: (id: string) => request<{ lesson: LessonOut }>(`/api/lessons/${encodeURIComponent(id)}`),

  quizzes: (moduleId?: string) =>
    request<{ quizzes: QuizOut[] }>(
      moduleId ? `/api/quizzes?moduleId=${encodeURIComponent(moduleId)}` : "/api/quizzes"
    ),

  quiz: (id: string) => request<{ quiz: QuizOut }>(`/api/quizzes/${encodeURIComponent(id)}`),
  submitEssayQuiz: (quizId: string, answers: string[]) =>
    request<{ submission: EssaySubmissionOut }>(`/api/quizzes/${encodeURIComponent(quizId)}/essay-submissions`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  myEssaySubmission: (quizId: string) =>
    request<{ submission: EssaySubmissionOut }>(`/api/quizzes/${encodeURIComponent(quizId)}/essay-submissions/me`),

  vocabulary: (opts?: { limit?: number; tag?: string }) => {
    const p = new URLSearchParams();
    if (opts?.limit) p.set("limit", String(opts.limit));
    if (opts?.tag) p.set("tag", opts.tag);
    const q = p.toString();
    return request<{ words: VocabWord[] }>(`/api/vocabulary${q ? `?${q}` : ""}`);
  },

  games: () => request<{ games: GameOut[] }>("/api/games"),

  notes: {
    list: () => request<{ notes: NoteOut[] }>("/api/notes"),
    create: (body: { title?: string; body?: string; lessonId?: string }) =>
      request<{ note: NoteOut }>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
    patch: (id: string, body: Partial<{ title: string; body: string; lessonId: string }>) =>
      request<{ note: NoteOut }>(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) => request<{ ok: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
  },

  progress: {
    list: () => request<{ progress: ProgressOut[] }>("/api/progress"),
    save: (body: {
      lessonId: string;
      started?: boolean;
      completed?: boolean;
      quizScore?: number;
    }) =>
      request<{ progress: ProgressOut }>("/api/progress", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  analytics: (body: { name: string; path: string; meta?: Record<string, unknown> }) =>
    request<{ id: string }>("/api/analytics", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  admin: {
    createModule: (body: Record<string, unknown>) =>
      request<{ module: ModuleOut }>("/api/admin/modules", { method: "POST", body: JSON.stringify(body) }),
    updateModule: (id: string, body: Record<string, unknown>) =>
      request<{ module: ModuleOut }>(`/api/admin/modules/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteModule: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/modules/${encodeURIComponent(id)}`, { method: "DELETE" }),
    listGames: () => request<{ games: GameOut[] }>("/api/admin/games"),
    listEssaySubmissions: (quizId?: string) =>
      request<{ submissions: EssaySubmissionOut[] }>(
        quizId
          ? `/api/admin/essay-submissions?quizId=${encodeURIComponent(quizId)}`
          : "/api/admin/essay-submissions"
      ),
    deleteEssaySubmission: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/essay-submissions/${encodeURIComponent(id)}`, { method: "DELETE" }),
    clearEssaySubmissions: (quizId?: string) =>
      request<{ ok: boolean; deleted: number }>(
        quizId
          ? `/api/admin/essay-submissions?quizId=${encodeURIComponent(quizId)}`
          : "/api/admin/essay-submissions",
        { method: "DELETE" }
      ),
    gradeEssaySubmission: (
      id: string,
      grades: { score: number | null; maxScore: number | null; feedback?: string }[]
    ) =>
      request<{ submission: EssaySubmissionOut }>(`/api/admin/essay-submissions/${encodeURIComponent(id)}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ grades }),
      }),
    createLesson: (body: Record<string, unknown>) =>
      request<{ lesson: LessonOut }>("/api/admin/lessons", { method: "POST", body: JSON.stringify(body) }),
    updateLesson: (id: string, body: Record<string, unknown>) =>
      request<{ lesson: LessonOut }>(`/api/admin/lessons/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteLesson: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/lessons/${encodeURIComponent(id)}`, { method: "DELETE" }),
    createQuiz: (body: Record<string, unknown>) =>
      request<{ quiz: QuizOut }>("/api/admin/quizzes", { method: "POST", body: JSON.stringify(body) }),
    updateQuiz: (id: string, body: Record<string, unknown>) =>
      request<{ quiz: QuizOut }>(`/api/admin/quizzes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteQuiz: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/quizzes/${encodeURIComponent(id)}`, { method: "DELETE" }),
    createGame: (body: Record<string, unknown>) =>
      request<{ game: GameOut }>("/api/admin/games", { method: "POST", body: JSON.stringify(body) }),
    updateGame: (id: string, body: Record<string, unknown>) =>
      request<{ game: GameOut }>(`/api/admin/games/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteGame: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/games/${encodeURIComponent(id)}`, { method: "DELETE" }),
    deleteAllGames: () => request<{ ok: boolean }>("/api/admin/games", { method: "DELETE" }),

    createVocab: (body: { bikol: string; filipino: string; english: string; example?: string; tags?: string[] }) =>
      request<{ word: VocabWord }>("/api/admin/vocabulary", { method: "POST", body: JSON.stringify(body) }),
    updateVocab: (
      id: string,
      body: Partial<{ bikol: string; filipino: string; english: string; example: string; tags: string[] }>
    ) =>
      request<{ word: VocabWord }>(`/api/admin/vocabulary/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteVocab: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/vocabulary/${encodeURIComponent(id)}`, { method: "DELETE" }),

    /** Multipart upload to Cloudinary (admin). */
    uploadImage: async (file: File): Promise<{ url: string }> => {
      const form = new FormData();
      form.append("file", file);
      const headers = new Headers();
      const t = getToken();
      if (t) headers.set("Authorization", `Bearer ${t}`);
      const res = await fetch(`${base}/api/admin/upload`, { method: "POST", body: form, headers });
      const text = await res.text();
      const data = text ? (JSON.parse(text) as unknown) : null;
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && data !== null && "message" in data
            ? String((data as { message: string }).message)
            : res.statusText;
        throw new Error(msg || "Upload failed");
      }
      return data as { url: string };
    },
  },
};

export type UserOut = {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
};

export type ModuleType = "grammar" | "vocabulary" | "conversation" | "culture" | "general";

export const MODULE_TYPE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "conversation", label: "Conversation" },
  { value: "culture", label: "Culture & context" },
];

export type ModuleOut = {
  _id: string;
  title: string;
  description: string;
  order: number;
  slug: string;
  moduleType?: ModuleType;
  lessons: LessonSummary[];
};

export type LessonSummary = {
  _id: string;
  moduleId: string;
  title: string;
  slug: string;
  order: number;
  lessonType?: "flipbook" | "simple";
};

export type LanguagePageOut = {
  label: string;
  definition: string;
  examples: string[];
  categories: { title: string; description: string }[];
};

export type LessonOut = {
  _id: string;
  title: string;
  content: string;
  languagePages?: LanguagePageOut[];
  /** Multi-slide simple lessons (falls back to `content` if empty) */
  simpleSlides?: string[];
  lessonType?: "flipbook" | "simple";
  slug: string;
  order?: number;
  moduleId: ModuleOut | string;
};

export type QuizOut = {
  _id: string;
  title: string;
  moduleId?: string;
  quizType?: "multiple_choice" | "true_false" | "essay";
  questions: { prompt: string; options?: string[]; correctIndex?: number | null; sampleAnswer?: string }[];
};

export type GameOut = {
  _id: string;
  title: string;
  description: string;
  order: number;
  gameType:
    | "word_scramble"
    | "sentence_correct"
    | "describe_see"
    | "word_search"
    | "match_pairs"
    | "language_challenge";
  config: {
    pairCount?: number;
    vocabularyTag?: string;
    answerSide?: "bikol" | "filipino" | "english";
    questions?: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[];
    scrambleMode?: "vocabulary" | "custom";
    scramblePuzzles?: { letters: string; answer: string; hint?: string }[];
    wordSearchCount?: number;
    items?: unknown[];
  };
  published: boolean;
};

export type VocabWord = {
  _id: string;
  bikol: string;
  filipino: string;
  english: string;
  example: string;
  tags: string[];
};

export type NoteOut = {
  _id: string;
  title: string;
  body: string;
  lessonId?: string;
  updatedAt: string;
};

export type ProgressOut = {
  _id: string;
  lessonId: string;
  started?: boolean;
  completed: boolean;
  quizScore: number | null;
};

export type EssaySubmissionOut = {
  _id: string;
  quizId:
    | string
    | {
        _id: string;
        title?: string;
      };
  userId:
    | string
    | {
        _id: string;
        displayName?: string;
        email?: string;
      };
  responses: {
    prompt: string;
    answer: string;
    sampleAnswer?: string;
    score?: number | null;
    maxScore?: number | null;
    feedback?: string;
  }[];
  createdAt: string;
};
