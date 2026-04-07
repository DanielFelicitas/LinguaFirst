import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { PaginationBar } from "@/components/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { CONTENT_PAGE_SIZE, slicePage, totalPages } from "@/lib/pagination";
import {
  api,
  MODULE_TYPE_OPTIONS,
  type GameOut,
  type LessonSummary,
  type ModuleOut,
  type ModuleType,
  type QuizOut,
  type VocabWord,
} from "@/lib/api";

const FLIP_LABELS = ["Naga Bicol", "Rinconada Bikol", "Filipino", "English"] as const;
const MAX_SIMPLE_SLIDES = 40;

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function moduleTypeLabel(t?: ModuleType) {
  return MODULE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "General";
}

function BrowseEditorLayout({ list, editor }: { list: ReactNode; editor: ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-2 xl:items-start xl:gap-10">
      <div className="min-w-0 space-y-3">{list}</div>
      <div className="min-w-0 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto xl:pb-8">
        {editor}
      </div>
    </div>
  );
}

type Segment = "module" | "lesson" | "quiz" | "game" | "vocabulary";

type LessonRow = { lesson: LessonSummary; moduleTitle: string; moduleId: string };

export function AdminContent() {
  const { user, loading } = useAuth();
  const [segment, setSegment] = useState<Segment>("module");

  const [fullModules, setFullModules] = useState<ModuleOut[]>([]);
  const [quizList, setQuizList] = useState<QuizOut[]>([]);
  const [gameList, setGameList] = useState<GameOut[]>([]);
  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);

  const [modTitle, setModTitle] = useState("");
  const [modSlug, setModSlug] = useState("");
  const [modDesc, setModDesc] = useState("");
  const [modOrder, setModOrder] = useState("0");
  const [modType, setModType] = useState<ModuleType>("general");

  const [lessonType, setLessonType] = useState<"flipbook" | "simple">("flipbook");
  const [quizType, setQuizType] = useState<"multiple_choice" | "true_false" | "essay">("multiple_choice");
  const [gameType, setGameType] = useState<
    | "match_pairs"
    | "word_scramble"
    | "sentence_correct"
    | "describe_see"
    | "language_challenge"
    | "word_search"
  >("match_pairs");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [lModuleId, setLModuleId] = useState("");
  const [lTitle, setLTitle] = useState("");
  const [lSlug, setLSlug] = useState("");
  const [lOrder, setLOrder] = useState("0");
  const [simpleSlides, setSimpleSlides] = useState<string[]>([""]);
  const [flipDefs, setFlipDefs] = useState(["", "", "", ""]);
  const [flipEx, setFlipEx] = useState(["", "", "", ""]);

  const [qTitle, setQTitle] = useState("");
  const [qModuleId, setQModuleId] = useState("");
  const [qPrompts, setQPrompts] = useState<string[]>([""]);
  const [qOpts, setQOpts] = useState<string[][]>([["", "", "", ""]]);
  const [qCorrect, setQCorrect] = useState<number[]>([0]);
  const [qTfCorrect, setQTfCorrect] = useState<boolean[]>([true]);
  const [qEssayAnswers, setQEssayAnswers] = useState<string[]>([""]);

  const [gTitle, setGTitle] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gOrder, setGOrder] = useState("0");
  const [gPairCount, setGPairCount] = useState("6");
  const [gWordSearchCount, setGWordSearchCount] = useState("6");
  const [gTag, setGTag] = useState("");
  const [gAnswerSide, setGAnswerSide] = useState<"bikol" | "filipino" | "english">("bikol");
  const [gScrambleMode, setGScrambleMode] = useState<"vocabulary" | "custom">("vocabulary");
  const [gScrambleLetters, setGScrambleLetters] = useState<string[]>([""]);
  const [gScrambleAnswers, setGScrambleAnswers] = useState<string[]>([""]);
  const [gScrambleHints, setGScrambleHints] = useState<string[]>([""]);
  const [gSentenceText, setGSentenceText] = useState<string[]>([""]);
  const [gSentenceCorrect, setGSentenceCorrect] = useState<boolean[]>([true]);
  const [gSentenceExplain, setGSentenceExplain] = useState<string[]>([""]);
  const [gDescribeImage, setGDescribeImage] = useState<string[]>([""]);
  const [gDescribePrompt, setGDescribePrompt] = useState<string[]>([""]);
  const [gDescribeOpts, setGDescribeOpts] = useState<string[][]>([["", "", "", ""]]);
  const [gDescribeCorrect, setGDescribeCorrect] = useState<number[]>([0]);
  const [describeUploading, setDescribeUploading] = useState<number | null>(null);
  const [gChallengePrompts, setGChallengePrompts] = useState<string[]>([""]);
  const [gChallengeOpts, setGChallengeOpts] = useState<string[][]>([["", "", "", ""]]);
  const [gChallengeCorrect, setGChallengeCorrect] = useState<number[]>([0]);
  const [gChallengeExplanations, setGChallengeExplanations] = useState<string[]>([""]);
  const [gPublished, setGPublished] = useState(true);

  const [vBikol, setVBikol] = useState("");
  const [vFilipino, setVFilipino] = useState("");
  const [vEnglish, setVEnglish] = useState("");
  const [vExample, setVExample] = useState("");
  const [vTags, setVTags] = useState("");

  const moduleOptions = useMemo(
    () => [...fullModules].sort((a, b) => a.order - b.order).map((m) => ({ _id: m._id, title: m.title })),
    [fullModules]
  );

  const lessonRows: LessonRow[] = useMemo(() => {
    const rows: LessonRow[] = [];
    [...fullModules]
      .sort((a, b) => a.order - b.order)
      .forEach((m) => {
        [...m.lessons]
          .sort((a, b) => a.order - b.order)
          .forEach((l) => {
            rows.push({ lesson: l, moduleTitle: m.title, moduleId: m._id });
          });
      });
    return rows;
  }, [fullModules]);

  const sortedModulesAdmin = useMemo(
    () => [...fullModules].sort((a, b) => a.order - b.order),
    [fullModules]
  );

  const [contentListPage, setContentListPage] = useState(1);

  useEffect(() => {
    setContentListPage(1);
  }, [segment]);

  const adminContentCount =
    segment === "module"
      ? sortedModulesAdmin.length
      : segment === "lesson"
        ? lessonRows.length
        : segment === "quiz"
          ? quizList.length
          : segment === "game"
            ? gameList.length
            : vocabList.length;

  const adminContentTotalPages = totalPages(adminContentCount, CONTENT_PAGE_SIZE);

  useEffect(() => {
    setContentListPage((p) => Math.min(p, adminContentTotalPages));
  }, [adminContentTotalPages]);

  const pagedModulesAdmin = useMemo(
    () => slicePage(sortedModulesAdmin, contentListPage, CONTENT_PAGE_SIZE),
    [sortedModulesAdmin, contentListPage]
  );
  const pagedLessonRows = useMemo(
    () => slicePage(lessonRows, contentListPage, CONTENT_PAGE_SIZE),
    [lessonRows, contentListPage]
  );
  const pagedQuizList = useMemo(
    () => slicePage(quizList, contentListPage, CONTENT_PAGE_SIZE),
    [quizList, contentListPage]
  );
  const pagedGameList = useMemo(
    () => slicePage(gameList, contentListPage, CONTENT_PAGE_SIZE),
    [gameList, contentListPage]
  );
  const pagedVocabList = useMemo(
    () => slicePage(vocabList, contentListPage, CONTENT_PAGE_SIZE),
    [vocabList, contentListPage]
  );

  const refreshData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [modRes, quizRes, gameRes] = await Promise.all([
        api.modules(),
        api.quizzes(),
        api.admin.listGames(),
      ]);
      setFullModules(modRes.modules);
      setQuizList(quizRes.quizzes);
      setGameList(gameRes.games);
      setLModuleId((prev) => prev || modRes.modules[0]?._id || "");
      const vocabRes = await api.vocabulary({ limit: 500 });
      setVocabList(vocabRes.words);
    } catch {
      /* ignore */
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    setQOpts((opts) => {
      if (quizType === "true_false") return opts.map(() => ["True", "False"]);
      if (quizType === "essay") return opts.map(() => []);
      return opts.map(() => ["", "", "", ""]);
    });
  }, [quizType]);

  useEffect(() => {
    if (editingLessonId) return;
    setLSlug(slugify(lTitle));
  }, [lTitle, editingLessonId]);

  useEffect(() => {
    if (editingModuleId) return;
    setModSlug(slugify(modTitle));
  }, [modTitle, editingModuleId]);

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonType("flipbook");
    setLTitle("");
    setLSlug("");
    setLOrder("0");
    setSimpleSlides([""]);
    setFlipDefs(["", "", "", ""]);
    setFlipEx(["", "", "", ""]);
    if (moduleOptions[0]) setLModuleId(moduleOptions[0]._id);
  };

  const resetQuizForm = () => {
    setEditingQuizId(null);
    setQuizType("multiple_choice");
    setQTitle("");
    setQModuleId("");
    setQPrompts([""]);
    setQOpts([["", "", "", ""]]);
    setQCorrect([0]);
    setQTfCorrect([true]);
    setQEssayAnswers([""]);
  };

  const resetGameForm = () => {
    setEditingGameId(null);
    setGameType("match_pairs");
    setGTitle("");
    setGDesc("");
    setGOrder("0");
    setGPairCount("6");
    setGWordSearchCount("6");
    setGTag("");
    setGAnswerSide("bikol");
    setGScrambleMode("vocabulary");
    setGScrambleLetters([""]);
    setGScrambleAnswers([""]);
    setGScrambleHints([""]);
    setGSentenceText([""]);
    setGSentenceCorrect([true]);
    setGSentenceExplain([""]);
    setGDescribeImage([""]);
    setGDescribePrompt([""]);
    setGDescribeOpts([["", "", "", ""]]);
    setGDescribeCorrect([0]);
    setGChallengePrompts([""]);
    setGChallengeOpts([["", "", "", ""]]);
    setGChallengeCorrect([0]);
    setGChallengeExplanations([""]);
    setGPublished(true);
  };

  const resetModuleForm = () => {
    setEditingModuleId(null);
    setModTitle("");
    setModSlug("");
    setModDesc("");
    setModOrder("0");
    setModType("general");
  };

  const resetVocabForm = () => {
    setEditingVocabId(null);
    setVBikol("");
    setVFilipino("");
    setVEnglish("");
    setVExample("");
    setVTags("");
  };

  const switchSegment = (s: Segment) => {
    setSegment(s);
    setMsg(null);
    setErr(null);
    resetLessonForm();
    resetQuizForm();
    resetGameForm();
    resetModuleForm();
    resetVocabForm();
  };

  const loadLessonForEdit = async (id: string) => {
    setErr(null);
    try {
      const { lesson } = await api.lesson(id);
      setEditingLessonId(id);
      const lt = lesson.lessonType === "simple" ? "simple" : "flipbook";
      setLessonType(lt);
      const mid =
        typeof lesson.moduleId === "object" && lesson.moduleId && "_id" in lesson.moduleId
          ? String(lesson.moduleId._id)
          : String(lesson.moduleId);
      setLModuleId(mid);
      setLTitle(lesson.title);
      setLSlug(lesson.slug);
      setLOrder(String(lesson.order ?? 0));
      if (lt === "simple") {
        const slides =
          Array.isArray(lesson.simpleSlides) && lesson.simpleSlides.length > 0
            ? lesson.simpleSlides.map((s) => String(s))
            : [lesson.content || ""];
        setSimpleSlides(slides.length ? slides : [""]);
      } else {
        setSimpleSlides([""]);
      }
      const pages = lesson.languagePages || [];
      setFlipDefs(
        FLIP_LABELS.map((_, i) => pages[i]?.definition?.trim() || "")
      );
      setFlipEx(
        FLIP_LABELS.map((_, i) => (pages[i]?.examples || []).join("\n"))
      );
      setMsg(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load lesson");
    }
  };

  const loadQuizForEdit = async (id: string) => {
    setErr(null);
    try {
      const { quiz } = await api.quiz(id);
      setEditingQuizId(id);
      setQTitle(quiz.title);
      setQModuleId(quiz.moduleId ? String(quiz.moduleId) : "");
      const qt = quiz.quizType === "true_false" ? "true_false" : quiz.quizType === "essay" ? "essay" : "multiple_choice";
      setQuizType(qt);
      const prompts = quiz.questions.map((q) => q.prompt);
      const opts = quiz.questions.map((q) => {
        if (qt === "true_false") return ["True", "False"];
        if (qt === "essay") return [];
        const row = Array.isArray(q.options) ? q.options : [];
        return [...row, "", "", "", ""].slice(0, 4);
      });
      const correct = quiz.questions.map((q) => Number(q.correctIndex) || 0);
      const tf = quiz.questions.map((q) => q.correctIndex === 0);
      const essay = quiz.questions.map((q) => q.sampleAnswer || "");
      setQPrompts(prompts.length ? prompts : [""]);
      setQOpts(opts.length ? opts : [["", "", "", ""]]);
      setQCorrect(correct.length ? correct : [0]);
      setQTfCorrect(tf.length ? tf : [true]);
      setQEssayAnswers(essay.length ? essay : [""]);
      setMsg(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load quiz");
    }
  };

  const loadGameForEdit = (g: GameOut) => {
    setEditingGameId(g._id);
    setGTitle(g.title);
    setGDesc(g.description || "");
    setGOrder(String(g.order ?? 0));
    const gt =
      g.gameType === "sentence_correct"
        ? "sentence_correct"
        : g.gameType === "describe_see"
          ? "describe_see"
          : g.gameType === "language_challenge"
        ? "language_challenge"
        : g.gameType === "word_scramble"
          ? "word_scramble"
          : g.gameType === "word_search"
            ? "word_search"
            : "match_pairs";
    setGameType(gt);
    setGPairCount(String(g.config?.pairCount ?? 6));
    setGWordSearchCount(String(g.config?.wordSearchCount ?? 6));
    setGTag(g.config?.vocabularyTag || "");
    setGAnswerSide(
      g.config?.answerSide === "english"
        ? "english"
        : g.config?.answerSide === "filipino"
          ? "filipino"
          : "bikol"
    );
    const scrambleMode = g.config?.scrambleMode === "custom" ? "custom" : "vocabulary";
    setGScrambleMode(scrambleMode);
    const puzzles = Array.isArray(g.config?.scramblePuzzles) ? g.config.scramblePuzzles : [];
    if (puzzles.length > 0) {
      setGScrambleLetters(puzzles.map((p) => p.letters || ""));
      setGScrambleAnswers(puzzles.map((p) => p.answer || ""));
      setGScrambleHints(puzzles.map((p) => p.hint || ""));
    } else {
      setGScrambleLetters([""]);
      setGScrambleAnswers([""]);
      setGScrambleHints([""]);
    }

    // sentence_correct / describe_see
    const items = Array.isArray((g.config as any)?.items) ? ((g.config as any).items as any[]) : [];
    if (gt === "sentence_correct") {
      if (items.length > 0) {
        setGSentenceText(items.map((it) => String(it?.sentence ?? "")));
        setGSentenceCorrect(items.map((it) => Boolean(it?.correct)));
        setGSentenceExplain(items.map((it) => String(it?.explanation ?? "")));
      } else {
        setGSentenceText([""]);
        setGSentenceCorrect([true]);
        setGSentenceExplain([""]);
      }
    } else {
      setGSentenceText([""]);
      setGSentenceCorrect([true]);
      setGSentenceExplain([""]);
    }
    if (gt === "describe_see") {
      if (items.length > 0) {
        setGDescribeImage(items.map((it) => String(it?.imageDataUrl ?? "")));
        setGDescribePrompt(items.map((it) => String(it?.prompt ?? "")));
        setGDescribeOpts(
          items.map((it) => {
            const row = Array.isArray(it?.options) ? it.options.map((o: unknown) => String(o ?? "")) : [];
            return [...row, "", "", "", ""].slice(0, 4);
          })
        );
        setGDescribeCorrect(items.map((it) => Number(it?.correctIndex) || 0));
      } else {
        setGDescribeImage([""]);
        setGDescribePrompt([""]);
        setGDescribeOpts([["", "", "", ""]]);
        setGDescribeCorrect([0]);
      }
    } else {
      setGDescribeImage([""]);
      setGDescribePrompt([""]);
      setGDescribeOpts([["", "", "", ""]]);
      setGDescribeCorrect([0]);
    }
    if (gt === "language_challenge") {
      const qs = Array.isArray(g.config?.questions) ? g.config.questions : [];
      if (qs.length > 0) {
        setGChallengePrompts(qs.map((q) => q.prompt || ""));
        setGChallengeOpts(
          qs.map((q) => {
            const row = Array.isArray(q.options) ? q.options.map((o) => String(o ?? "")) : [];
            return [...row, "", "", "", ""].slice(0, 4);
          })
        );
        setGChallengeCorrect(qs.map((q) => Number(q.correctIndex) || 0));
        setGChallengeExplanations(qs.map((q) => q.explanation || ""));
      } else {
        setGChallengePrompts([""]);
        setGChallengeOpts([["", "", "", ""]]);
        setGChallengeCorrect([0]);
        setGChallengeExplanations([""]);
      }
    } else {
      setGChallengePrompts([""]);
      setGChallengeOpts([["", "", "", ""]]);
      setGChallengeCorrect([0]);
      setGChallengeExplanations([""]);
    }
    setGPublished(g.published !== false);
    setErr(null);
    setMsg(null);
  };

  const loadModuleForEdit = (m: ModuleOut) => {
    setEditingModuleId(m._id);
    setModTitle(m.title);
    setModSlug(m.slug);
    setModDesc(m.description || "");
    setModOrder(String(m.order ?? 0));
    setModType(m.moduleType ?? "general");
    setErr(null);
    setMsg(null);
  };

  const loadVocabForEdit = (w: VocabWord) => {
    setEditingVocabId(w._id);
    setVBikol(w.bikol || "");
    setVFilipino(w.filipino || "");
    setVEnglish(w.english || "");
    setVExample(w.example || "");
    setVTags((w.tags || []).join(", "));
    setErr(null);
    setMsg(null);
  };

  const submitVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      const tags = vTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        bikol: vBikol.trim(),
        filipino: vFilipino.trim(),
        english: vEnglish.trim(),
        example: vExample.trim(),
        tags,
      };
      if (!body.bikol || !body.filipino || !body.english) {
        throw new Error("Bikol, Filipino and English are required");
      }
      if (editingVocabId) {
        await api.admin.updateVocab(editingVocabId, body);
        setMsg("Vocabulary word updated.");
      } else {
        await api.admin.createVocab(body);
        setMsg("Vocabulary word added.");
      }
      resetVocabForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const deleteVocab = async (id: string, label: string) => {
    if (!confirm(`Delete vocabulary word “${label}”?`)) return;
    setErr(null);
    try {
      await api.admin.deleteVocab(id);
      setMsg("Vocabulary word deleted.");
      if (editingVocabId === id) resetVocabForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const submitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      if (!modTitle.trim()) throw new Error("Title is required");
      const slug = modSlug.trim() || slugify(modTitle);
      const body = {
        title: modTitle.trim(),
        slug,
        description: modDesc.trim(),
        order: Number(modOrder) || 0,
        moduleType: modType,
      };
      if (editingModuleId) {
        await api.admin.updateModule(editingModuleId, body);
        setMsg("Module updated.");
      } else {
        await api.admin.createModule(body);
        setMsg("Module created.");
      }
      resetModuleForm();
      await refreshData();
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const deleteModule = async (m: ModuleOut) => {
    const nLessons = m.lessons?.length ?? 0;
    const warn =
      nLessons > 0
        ? `Delete module “${m.title}” and its ${nLessons} lesson(s)? Linked quizzes in this module are removed too. This cannot be undone.`
        : `Delete module “${m.title}”? This cannot be undone.`;
    if (!confirm(warn)) return;
    setErr(null);
    try {
      await api.admin.deleteModule(m._id);
      setMsg("Module deleted.");
      if (editingModuleId === m._id) resetModuleForm();
      await refreshData();
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  const addQuestion = () => {
    setQPrompts((p) => [...p, ""]);
    setQOpts((o) => [...o, quizType === "true_false" ? ["True", "False"] : quizType === "essay" ? [] : ["", "", "", ""]]);
    setQCorrect((c) => [...c, 0]);
    setQTfCorrect((t) => [...t, true]);
    setQEssayAnswers((x) => [...x, ""]);
  };

  const buildLessonPayload = () => {
    const slug = lSlug.trim() || slugify(lTitle);
    if (lessonType === "simple") {
      const slides = simpleSlides.length > 0 ? simpleSlides : [""];
      return {
        moduleId: lModuleId,
        title: lTitle.trim(),
        slug,
        order: Number(lOrder) || 0,
        lessonType: "simple",
        content: slides[0] ?? "",
        simpleSlides: slides,
        languagePages: [],
      };
    }
    const languagePages = FLIP_LABELS.map((label, i) => ({
      label,
      definition: flipDefs[i]?.trim() || "",
      examples: (flipEx[i] || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      categories: [] as { title: string; description: string }[],
    }));
    return {
      moduleId: lModuleId,
      title: lTitle.trim(),
      slug,
      order: Number(lOrder) || 0,
      lessonType: "flipbook",
      content: "",
      simpleSlides: [],
      languagePages,
    };
  };

  const submitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      if (!lModuleId || !lTitle.trim()) throw new Error("Module and title are required");
      const payload = buildLessonPayload();
      if (editingLessonId) {
        await api.admin.updateLesson(editingLessonId, payload);
        setMsg("Lesson updated.");
      } else {
        await api.admin.createLesson(payload);
        setMsg("Lesson created.");
      }
      resetLessonForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const deleteLesson = async (id: string, title: string) => {
    if (!confirm(`Delete lesson “${title}”? This cannot be undone.`)) return;
    setErr(null);
    try {
      await api.admin.deleteLesson(id);
      setMsg("Lesson deleted.");
      if (editingLessonId === id) resetLessonForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const buildQuizQuestions = () => {
    return qPrompts.map((prompt, i) => {
      if (quizType === "true_false") {
        return {
          prompt: prompt.trim(),
          options: ["True", "False"],
          correctIndex: qTfCorrect[i] ? 0 : 1,
        };
      }
      if (quizType === "essay") {
        return {
          prompt: prompt.trim(),
          sampleAnswer: (qEssayAnswers[i] || "").trim(),
        };
      }
      const opts = (qOpts[i] || []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) throw new Error("Each question needs at least 2 options");
      const ci = qCorrect[i] ?? 0;
      if (ci < 0 || ci >= opts.length) throw new Error("Invalid correct answer index");
      return { prompt: prompt.trim(), options: opts, correctIndex: ci };
    });
  };

  const submitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      if (!qTitle.trim()) throw new Error("Title is required");
      const questions = buildQuizQuestions();
      if (questions.some((q) => !q.prompt)) throw new Error("All questions need a prompt");
      const body = {
        title: qTitle.trim(),
        moduleId: qModuleId || undefined,
        quizType,
        questions,
      };
      if (editingQuizId) {
        await api.admin.updateQuiz(editingQuizId, body);
        setMsg("Quiz updated.");
      } else {
        await api.admin.createQuiz(body);
        setMsg("Quiz created.");
      }
      resetQuizForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const deleteQuiz = async (id: string, title: string) => {
    if (!confirm(`Delete quiz “${title}”?`)) return;
    setErr(null);
    try {
      await api.admin.deleteQuiz(id);
      setMsg("Quiz deleted.");
      if (editingQuizId === id) resetQuizForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const addChallengeQuestion = () => {
    setGChallengePrompts((p) => [...p, ""]);
    setGChallengeOpts((o) => [...o, ["", "", "", ""]]);
    setGChallengeCorrect((c) => [...c, 0]);
    setGChallengeExplanations((x) => [...x, ""]);
  };

  const addScramblePuzzle = () => {
    setGScrambleLetters((x) => [...x, ""]);
    setGScrambleAnswers((x) => [...x, ""]);
    setGScrambleHints((x) => [...x, ""]);
  };

  const addSentenceItem = () => {
    setGSentenceText((x) => [...x, ""]);
    setGSentenceCorrect((x) => [...x, true]);
    setGSentenceExplain((x) => [...x, ""]);
  };

  const addDescribeItem = () => {
    setGDescribeImage((x) => [...x, ""]);
    setGDescribePrompt((x) => [...x, ""]);
    setGDescribeOpts((x) => [...x, ["", "", "", ""]]);
    setGDescribeCorrect((x) => [...x, 0]);
  };

  const submitGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      if (!gTitle.trim()) throw new Error("Title is required");
      const config =
        gameType === "match_pairs"
          ? {
              pairCount: Math.min(12, Math.max(3, Number(gPairCount) || 6)),
              vocabularyTag: gTag.trim() || undefined,
            }
          : gameType === "word_scramble"
            ? {
                scrambleMode: gScrambleMode,
                vocabularyTag: gScrambleMode === "vocabulary" ? gTag.trim() || undefined : undefined,
                answerSide: gScrambleMode === "vocabulary" ? gAnswerSide : undefined,
                scramblePuzzles:
                  gScrambleMode === "custom"
                    ? gScrambleLetters.map((letters, i) => {
                        const answer = (gScrambleAnswers[i] || "").trim();
                        const lettersUp = (letters || "").trim().toUpperCase();
                        if (!lettersUp) throw new Error(`Scramble puzzle ${i + 1} needs letters`);
                        if (!answer) throw new Error(`Scramble puzzle ${i + 1} needs the correct answer`);
                        return {
                          letters: lettersUp,
                          answer,
                          hint: gScrambleHints[i]?.trim() || undefined,
                        };
                      })
                    : undefined,
              }
            : gameType === "sentence_correct"
              ? {
                  items: gSentenceText.map((sentence, i) => {
                    const s = sentence.trim();
                    if (!s) throw new Error(`Sentence item ${i + 1} needs text`);
                    return {
                      sentence: s,
                      correct: !!gSentenceCorrect[i],
                      explanation: gSentenceExplain[i]?.trim() || undefined,
                    };
                  }),
                }
              : gameType === "describe_see"
                ? {
                    items: gDescribePrompt.map((prompt, i) => {
                      const options = (gDescribeOpts[i] || []).map((o) => o.trim()).filter(Boolean);
                      if (options.length < 2) throw new Error(`Describe item ${i + 1} needs at least 2 options`);
                      const ci = gDescribeCorrect[i] ?? 0;
                      if (ci < 0 || ci >= options.length) throw new Error(`Describe item ${i + 1} has invalid correct option`);
                      const img = (gDescribeImage[i] || "").trim();
                      const p = prompt.trim();
                      if (!img && !p) throw new Error(`Describe item ${i + 1} needs an image URL or prompt`);
                      return {
                        imageDataUrl: img || undefined,
                        prompt: p || undefined,
                        options,
                        correctIndex: ci,
                      };
                    }),
                  }
            : gameType === "word_search"
              ? {
                  vocabularyTag: gTag.trim() || undefined,
                  wordSearchCount: Math.min(10, Math.max(4, Number(gWordSearchCount) || 6)),
                }
            : {
                questions: gChallengePrompts.map((prompt, i) => {
                  const options = (gChallengeOpts[i] || []).map((o) => o.trim()).filter(Boolean);
                  if (!prompt.trim()) throw new Error(`Challenge question ${i + 1} needs a prompt`);
                  if (options.length < 2) throw new Error(`Challenge question ${i + 1} needs at least 2 options`);
                  const ci = gChallengeCorrect[i] ?? 0;
                  if (ci < 0 || ci >= options.length) {
                    throw new Error(`Challenge question ${i + 1} has invalid correct answer`);
                  }
                  return {
                    prompt: prompt.trim(),
                    options,
                    correctIndex: ci,
                    explanation: gChallengeExplanations[i]?.trim() || undefined,
                  };
                }),
              };
      const body = {
        title: gTitle.trim(),
        description: gDesc.trim(),
        order: Number(gOrder) || 0,
        gameType,
        config,
        published: gPublished,
      };
      if (editingGameId) {
        await api.admin.updateGame(editingGameId, body);
        setMsg("Game updated.");
      } else {
        await api.admin.createGame(body);
        setMsg("Game created.");
      }
      resetGameForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const deleteGame = async (id: string, title: string) => {
    if (!confirm(`Delete game “${title}”?`)) return;
    setErr(null);
    try {
      await api.admin.deleteGame(id);
      setMsg("Game deleted.");
      if (editingGameId === id) resetGameForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const deleteAllGames = async () => {
    if (!confirm("Delete ALL games? This cannot be undone.")) return;
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      await api.admin.deleteAllGames();
      setMsg("All games deleted.");
      resetGameForm();
      await refreshData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setPending(false);
    }
  };

  const navItem = (s: Segment, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => switchSegment(s)}
      className={`flex w-full flex-col items-start rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        segment === s
          ? "border-teal-500 bg-teal-50 font-medium text-teal-900 ring-1 ring-teal-200"
          : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200 hover:bg-white"
      }`}
    >
      <span>{label}</span>
      <span className="text-xs font-normal text-slate-500">{hint}</span>
    </button>
  );

  const ListCard = ({
    title,
    subtitle,
    badge,
    onEdit,
    onDelete,
  }: {
    title: string;
    subtitle?: string;
    badge?: string;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        {badge ? (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const listPanelScroll =
    "max-h-[min(65vh,28rem)] space-y-3 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm";

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="mb-8">
        <p className="text-sm text-slate-500">
          <Link to="/dashboard" className="text-teal-600 hover:underline">
            ← Dashboard
          </Link>
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-slate-900"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Manage content
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose a section in the sidebar. <strong>Modules</strong> are the tracks on the lesson map—each has a{" "}
          <strong>type</strong> (grammar, vocabulary, etc.). Other tabs manage lessons, quizzes, and games. On a wide
          screen, the library and editor sit side by side.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside
          className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
          aria-label="Content areas"
        >
          {navItem("module", "Modules", "Tracks & types")}
          {navItem("lesson", "Lessons", "Flipbook or simple")}
          {navItem("quiz", "Quizzes", "MC or T/F")}
          {navItem("game", "Games", "Match, scramble, challenge")}
          {navItem("vocabulary", "Vocabulary", "Words for games")}
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
      {dataLoading ? <p className="text-sm text-slate-500">Loading your content…</p> : null}

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {msg}
        </div>
      ) : null}

      {segment === "module" ? (
        <BrowseEditorLayout
          list={
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">All modules</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Each module is a <strong>track</strong> on the lesson map. Pick a <strong>type</strong> (grammar,
                  vocabulary, etc.) to organize content. Deleting a module removes its lessons and linked quizzes.
                </p>
              </div>
              <div className={listPanelScroll}>
                {sortedModulesAdmin.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                    No modules yet. Create one with the form on the right.
                  </p>
                ) : (
                  pagedModulesAdmin.map((m) => (
                    <ListCard
                      key={m._id}
                      title={m.title}
                      subtitle={`${m.lessons.length} lesson(s) · order ${m.order}`}
                      badge={moduleTypeLabel(m.moduleType)}
                      onEdit={() => loadModuleForEdit(m)}
                      onDelete={() => void deleteModule(m)}
                    />
                  ))
                )}
              </div>
              <PaginationBar
                page={contentListPage}
                pageSize={CONTENT_PAGE_SIZE}
                totalItems={sortedModulesAdmin.length}
                onPageChange={setContentListPage}
              />
            </>
          }
          editor={
            <section className="rounded-2xl border-2 border-dashed border-violet-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-violet-900">
                  {editingModuleId ? "Edit module" : "Add a module"}
                </h2>
                {editingModuleId ? (
                  <button
                    type="button"
                    onClick={resetModuleForm}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
              <form onSubmit={submitModule} className="space-y-4">
                <label className="block text-sm">
                  <span className="text-slate-600">Module type</span>
                  <select
                    value={modType}
                    onChange={(e) => setModType(e.target.value as ModuleType)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {MODULE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-0.5 block text-xs text-slate-400">Groups this track on the lesson map.</span>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Title</span>
                  <input
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">URL slug</span>
                  <input
                    value={modSlug}
                    onChange={(e) => setModSlug(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {editingModuleId ? "Changing slug may affect links." : "Auto-filled from title; you can edit."}
                  </span>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Description</span>
                  <textarea
                    value={modDesc}
                    onChange={(e) => setModDesc(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Sort order</span>
                  <input
                    type="number"
                    value={modOrder}
                    onChange={(e) => setModOrder(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Saving…" : editingModuleId ? "Save module" : "Create module"}
                </button>
              </form>
            </section>
          }
        />
      ) : null}

      {segment === "lesson" ? (
        <BrowseEditorLayout
          list={
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Your lessons</h2>
                <p className="mt-1 text-sm text-slate-500">Grouped by module. Learners see these on the Lessons map.</p>
              </div>
              <div className={listPanelScroll}>
                {lessonRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                    No lessons yet. Add one with the form on the right.
                  </p>
                ) : (
                  pagedLessonRows.map(({ lesson, moduleTitle }) => (
                    <ListCard
                      key={lesson._id}
                      title={lesson.title}
                      subtitle={moduleTitle}
                      badge={lesson.lessonType === "simple" ? "Simple" : "Flipbook"}
                      onEdit={() => void loadLessonForEdit(lesson._id)}
                      onDelete={() => void deleteLesson(lesson._id, lesson.title)}
                    />
                  ))
                )}
              </div>
              <PaginationBar
                page={contentListPage}
                pageSize={CONTENT_PAGE_SIZE}
                totalItems={lessonRows.length}
                onPageChange={setContentListPage}
              />
            </>
          }
          editor={
          <section className="rounded-2xl border-2 border-dashed border-teal-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-teal-900">
                {editingLessonId ? "Edit lesson" : "Add a new lesson"}
              </h2>
              {editingLessonId ? (
                <button
                  type="button"
                  onClick={resetLessonForm}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <form onSubmit={submitLesson} className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-700">Lesson type</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={lessonType === "flipbook"}
                      onChange={() => setLessonType("flipbook")}
                    />
                    Flipbook — 4 language pages
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={lessonType === "simple"}
                      onChange={() => setLessonType("simple")}
                    />
                    Simple — one text block
                  </label>
                </div>
              </div>
              <label className="block text-sm">
                <span className="text-slate-600">Module</span>
                <select
                  value={lModuleId}
                  onChange={(e) => setLModuleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                >
                  {moduleOptions.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Title</span>
                <input
                  value={lTitle}
                  onChange={(e) => setLTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">URL slug</span>
                <input
                  value={lSlug}
                  onChange={(e) => setLSlug(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                />
                <span className="mt-0.5 block text-xs text-slate-400">
                  {editingLessonId ? "Changing slug may break old links." : "Auto-filled from title; you can edit."}
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Order in module</span>
                <input
                  type="number"
                  value={lOrder}
                  onChange={(e) => setLOrder(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {lessonType === "simple" ? (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="text-slate-600">Number of slides</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_SIMPLE_SLIDES}
                      value={simpleSlides.length}
                      onChange={(e) => {
                        const n = Math.min(
                          MAX_SIMPLE_SLIDES,
                          Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                        );
                        setSimpleSlides((prev) => {
                          if (n === prev.length) return prev;
                          if (n > prev.length) return [...prev, ...Array(n - prev.length).fill("")];
                          return prev.slice(0, n);
                        });
                      }}
                      className="mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2"
                    />
                    <span className="mt-0.5 block text-xs text-slate-400">
                      1–{MAX_SIMPLE_SLIDES} slides. Learners use Back / Next between slides; mark done is only on the last
                      slide.
                    </span>
                  </label>
                  {simpleSlides.map((slide, i) => (
                    <label key={i} className="block text-sm">
                      <span className="text-slate-600">Slide {i + 1}</span>
                      <textarea
                        value={slide}
                        onChange={(e) => {
                          const next = [...simpleSlides];
                          next[i] = e.target.value;
                          setSimpleSlides(next);
                        }}
                        rows={8}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Each language: definition + examples (one per line).</p>
                  {FLIP_LABELS.map((label, i) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                      <p className="text-sm font-semibold text-teal-800">{label}</p>
                      <label className="mt-2 block text-xs text-slate-600">
                        Definition
                        <textarea
                          value={flipDefs[i]}
                          onChange={(e) => {
                            const next = [...flipDefs];
                            next[i] = e.target.value;
                            setFlipDefs(next);
                          }}
                          rows={3}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="mt-2 block text-xs text-slate-600">
                        Examples (one per line)
                        <textarea
                          value={flipEx[i]}
                          onChange={(e) => {
                            const next = [...flipEx];
                            next[i] = e.target.value;
                            setFlipEx(next);
                          }}
                          rows={3}
                          className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : editingLessonId ? "Save changes" : "Create lesson"}
              </button>
            </form>
          </section>
          }
        />
      ) : null}

      {segment === "quiz" ? (
        <BrowseEditorLayout
          list={
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Your quizzes</h2>
                <p className="mt-1 text-sm text-slate-500">Shown on the Quiz page for learners.</p>
              </div>
              <div className={listPanelScroll}>
                {quizList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                    No quizzes yet. Add one on the right.
                  </p>
                ) : (
                  pagedQuizList.map((q) => (
                    <ListCard
                      key={q._id}
                      title={q.title}
                      subtitle={`${q.questions.length} question(s)`}
                      badge={
                        q.quizType === "true_false"
                          ? "True / false"
                          : q.quizType === "essay"
                            ? "Essay"
                            : "Multiple choice"
                      }
                      onEdit={() => void loadQuizForEdit(q._id)}
                      onDelete={() => void deleteQuiz(q._id, q.title)}
                    />
                  ))
                )}
              </div>
              <PaginationBar
                page={contentListPage}
                pageSize={CONTENT_PAGE_SIZE}
                totalItems={quizList.length}
                onPageChange={setContentListPage}
              />
            </>
          }
          editor={
          <section className="rounded-2xl border-2 border-dashed border-teal-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-teal-900">
                {editingQuizId ? "Edit quiz" : "Add a new quiz"}
              </h2>
              {editingQuizId ? (
                <button type="button" onClick={resetQuizForm} className="text-sm font-medium text-slate-600">
                  Cancel edit
                </button>
              ) : null}
            </div>
            <form onSubmit={submitQuiz} className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-700">Quiz type</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={quizType === "multiple_choice"}
                      onChange={() => setQuizType("multiple_choice")}
                    />
                    Multiple choice
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={quizType === "true_false"}
                      onChange={() => setQuizType("true_false")}
                    />
                    True / false
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={quizType === "essay"}
                      onChange={() => setQuizType("essay")}
                    />
                    Essay
                  </label>
                </div>
              </div>
              <label className="block text-sm">
                <span className="text-slate-600">Title</span>
                <input
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Module (optional)</span>
                <select
                  value={qModuleId}
                  onChange={(e) => setQModuleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="">— None —</option>
                  {moduleOptions.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              {qPrompts.map((prompt, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-medium text-slate-500">Question {i + 1}</p>
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      const next = [...qPrompts];
                      next[i] = e.target.value;
                      setQPrompts(next);
                    }}
                    rows={4}
                    placeholder="Question prompt (supports multiple lines)"
                    className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                  />
                  {quizType === "true_false" ? (
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <span>Correct:</span>
                      <select
                        value={qTfCorrect[i] ? "true" : "false"}
                        onChange={(e) => {
                          const next = [...qTfCorrect];
                          next[i] = e.target.value === "true";
                          setQTfCorrect(next);
                        }}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </label>
                  ) : quizType === "essay" ? (
                    <label className="mt-2 block text-sm">
                      <span className="text-slate-600">Reference answer (optional, for review)</span>
                      <textarea
                        value={qEssayAnswers[i] || ""}
                        onChange={(e) => {
                          const next = [...qEssayAnswers];
                          next[i] = e.target.value;
                          setQEssayAnswers(next);
                        }}
                        rows={3}
                        placeholder="Sample answer"
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </label>
                  ) : (
                    <>
                      {[0, 1, 2, 3].map((oi) => (
                        <input
                          key={oi}
                          value={qOpts[i]?.[oi] ?? ""}
                          onChange={(e) => {
                            const next = [...qOpts];
                            const row = [...(next[i] || ["", "", "", ""])];
                            row[oi] = e.target.value;
                            next[i] = row;
                            setQOpts(next);
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      ))}
                      <label className="mt-2 block text-sm">
                        Correct option (1–4)
                        <select
                          value={qCorrect[i] ?? 0}
                          onChange={(e) => {
                            const next = [...qCorrect];
                            next[i] = Number(e.target.value);
                            setQCorrect(next);
                          }}
                          className="ml-2 rounded border border-slate-200 px-2 py-1"
                        >
                          {[0, 1, 2, 3].map((j) => (
                            <option key={j} value={j}>
                              {j + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="text-sm text-teal-600 hover:underline">
                + Add question
              </button>
              <button
                type="submit"
                disabled={pending}
                className="block rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : editingQuizId ? "Save quiz" : "Create quiz"}
              </button>
            </form>
          </section>
          }
        />
      ) : null}

      {segment === "game" ? (
        <BrowseEditorLayout
          list={
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Your games</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Shown on the Games page. Draft games can be hidden with “Published” off.
                </p>
                {gameList.length > 0 ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void deleteAllGames()}
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete all games
                  </button>
                ) : null}
              </div>
              <div className={listPanelScroll}>
                {gameList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                    No games yet. Add one on the right.
                  </p>
                ) : (
                  pagedGameList.map((g) => (
                    <ListCard
                      key={g._id}
                      title={g.title}
                      subtitle={g.description || undefined}
                      badge={`${g.gameType === "match_pairs" ? "Match pairs" : g.gameType === "word_scramble" ? "Scramble words" : g.gameType === "sentence_correct" ? "Sentence correct?" : g.gameType === "describe_see" ? "Describe what you see" : g.gameType === "word_search" ? "Word search" : "Language challenge"}${g.published === false ? " · Hidden" : ""}`}
                      onEdit={() => loadGameForEdit(g)}
                      onDelete={() => void deleteGame(g._id, g.title)}
                    />
                  ))
                )}
              </div>
              <PaginationBar
                page={contentListPage}
                pageSize={CONTENT_PAGE_SIZE}
                totalItems={gameList.length}
                onPageChange={setContentListPage}
              />
            </>
          }
          editor={
          <section className="rounded-2xl border-2 border-dashed border-teal-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-teal-900">
                {editingGameId ? "Edit game" : "Add a new game"}
              </h2>
              {editingGameId ? (
                <button type="button" onClick={resetGameForm} className="text-sm font-medium text-slate-600">
                  Cancel edit
                </button>
              ) : null}
            </div>
            <form onSubmit={submitGame} className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-700">Game type</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "match_pairs"}
                      onChange={() => setGameType("match_pairs")}
                    />
                    Match pairs (Bikol ↔ English)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "word_scramble"}
                      onChange={() => setGameType("word_scramble")}
                    />
                    Word scramble
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "sentence_correct"}
                      onChange={() => setGameType("sentence_correct")}
                    />
                    Is the sentence correct?
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "describe_see"}
                      onChange={() => setGameType("describe_see")}
                    />
                    Describe what you see
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "word_search"}
                      onChange={() => setGameType("word_search")}
                    />
                    Word search
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={gameType === "language_challenge"}
                      onChange={() => setGameType("language_challenge")}
                    />
                    Language challenge (MCQ)
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={gPublished}
                  onChange={(e) => setGPublished(e.target.checked)}
                />
                Published (visible on Games page)
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Title</span>
                <input
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Description (optional)</span>
                <textarea
                  value={gDesc}
                  onChange={(e) => setGDesc(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Sort order</span>
                <input
                  type="number"
                  value={gOrder}
                  onChange={(e) => setGOrder(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {gameType === "match_pairs" ||
              gameType === "word_search" ||
              (gameType === "word_scramble" && gScrambleMode === "vocabulary") ? (
                <label className="block text-sm">
                  <span className="text-slate-600">Vocabulary tag (optional)</span>
                  <input
                    value={gTag}
                    onChange={(e) => setGTag(e.target.value)}
                    placeholder="e.g. basic"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              ) : null}
              {gameType === "match_pairs" ? (
                <label className="block text-sm">
                  <span className="text-slate-600">Number of pairs (3–12)</span>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    value={gPairCount}
                    onChange={(e) => setGPairCount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              ) : gameType === "word_scramble" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-medium text-slate-700">Scramble setup</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={gScrambleMode === "vocabulary"}
                        onChange={() => setGScrambleMode("vocabulary")}
                      />
                      Use vocabulary words
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={gScrambleMode === "custom"}
                        onChange={() => setGScrambleMode("custom")}
                      />
                      Custom letter boxes + answer
                    </label>
                  </div>
                  {gScrambleMode === "vocabulary" ? (
                    <label className="block text-sm">
                      <span className="text-slate-600">Answer language</span>
                      <select
                        value={gAnswerSide}
                        onChange={(e) => setGAnswerSide(e.target.value as "bikol" | "filipino" | "english")}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <option value="bikol">Unscramble Bikol</option>
                        <option value="filipino">Unscramble Filipino</option>
                        <option value="english">Unscramble English</option>
                      </select>
                    </label>
                  ) : (
                    <div className="space-y-3">
                      {gScrambleLetters.map((letters, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-medium text-slate-500">Puzzle {i + 1}</p>
                          <input
                            value={letters}
                            onChange={(e) => {
                              const next = [...gScrambleLetters];
                              next[i] = e.target.value;
                              setGScrambleLetters(next);
                            }}
                            placeholder="Letters shown in boxes (e.g. OTLGA)"
                            className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"
                          />
                          <input
                            value={gScrambleAnswers[i] || ""}
                            onChange={(e) => {
                              const next = [...gScrambleAnswers];
                              next[i] = e.target.value;
                              setGScrambleAnswers(next);
                            }}
                            placeholder="Correct answer (e.g. GATOL)"
                            className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                          <input
                            value={gScrambleHints[i] || ""}
                            onChange={(e) => {
                              const next = [...gScrambleHints];
                              next[i] = e.target.value;
                              setGScrambleHints(next);
                            }}
                            placeholder="Optional hint"
                            className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                        </div>
                      ))}
                      <button type="button" onClick={addScramblePuzzle} className="text-sm text-teal-700 hover:underline">
                        + Add scramble puzzle
                      </button>
                    </div>
                  )}
                </div>
              ) : gameType === "sentence_correct" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-medium text-slate-700">Sentence items</p>
                  {gSentenceText.map((sentence, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">Item {i + 1}</p>
                      <input
                        value={sentence}
                        onChange={(e) => {
                          const next = [...gSentenceText];
                          next[i] = e.target.value;
                          setGSentenceText(next);
                        }}
                        placeholder="Sentence"
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                      <label className="mt-2 flex items-center gap-2 text-sm">
                        <span>Correct?</span>
                        <select
                          value={gSentenceCorrect[i] ? "true" : "false"}
                          onChange={(e) => {
                            const next = [...gSentenceCorrect];
                            next[i] = e.target.value === "true";
                            setGSentenceCorrect(next);
                          }}
                          className="rounded border border-slate-200 px-2 py-1"
                        >
                          <option value="true">Correct</option>
                          <option value="false">Incorrect</option>
                        </select>
                      </label>
                      <input
                        value={gSentenceExplain[i] || ""}
                        onChange={(e) => {
                          const next = [...gSentenceExplain];
                          next[i] = e.target.value;
                          setGSentenceExplain(next);
                        }}
                        placeholder="Optional explanation"
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addSentenceItem} className="text-sm text-teal-700 hover:underline">
                    + Add sentence item
                  </button>
                </div>
              ) : gameType === "describe_see" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-medium text-slate-700">Describe items</p>
                  {gDescribePrompt.map((prompt, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">Item {i + 1}</p>
                      <label className="mt-2 block text-xs font-medium text-slate-600">
                        Image (Cloudinary URL or upload)
                      </label>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={gDescribeImage[i] || ""}
                          onChange={(e) => {
                            const next = [...gDescribeImage];
                            next[i] = e.target.value;
                            setGDescribeImage(next);
                          }}
                          placeholder="https://… (paste URL after upload)"
                          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={describeUploading === i}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              setErr(null);
                              setMsg(null);
                              setDescribeUploading(i);
                              try {
                                const { url } = await api.admin.uploadImage(f);
                                const next = [...gDescribeImage];
                                next[i] = url;
                                setGDescribeImage(next);
                                setMsg("Image uploaded to Cloudinary.");
                              } catch (ex) {
                                setErr(ex instanceof Error ? ex.message : "Upload failed");
                              } finally {
                                setDescribeUploading(null);
                              }
                            }}
                          />
                          {describeUploading === i ? "Uploading…" : "Upload"}
                        </label>
                      </div>
                      <input
                        value={prompt}
                        onChange={(e) => {
                          const next = [...gDescribePrompt];
                          next[i] = e.target.value;
                          setGDescribePrompt(next);
                        }}
                        placeholder="Prompt (optional if image provided)"
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                      {[0, 1, 2, 3].map((oi) => (
                        <input
                          key={oi}
                          value={gDescribeOpts[i]?.[oi] ?? ""}
                          onChange={(e) => {
                            const next = [...gDescribeOpts];
                            const row = [...(next[i] || ["", "", "", ""])];
                            row[oi] = e.target.value;
                            next[i] = row;
                            setGDescribeOpts(next);
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      ))}
                      <label className="mt-2 block text-sm">
                        Correct option (1–4)
                        <select
                          value={gDescribeCorrect[i] ?? 0}
                          onChange={(e) => {
                            const next = [...gDescribeCorrect];
                            next[i] = Number(e.target.value);
                            setGDescribeCorrect(next);
                          }}
                          className="ml-2 rounded border border-slate-200 px-2 py-1"
                        >
                          {[0, 1, 2, 3].map((j) => (
                            <option key={j} value={j}>
                              {j + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={addDescribeItem} className="text-sm text-teal-700 hover:underline">
                    + Add describe item
                  </button>
                </div>
              ) : gameType === "word_search" ? (
                <label className="block text-sm">
                  <span className="text-slate-600">Words in puzzle (4–10)</span>
                  <input
                    type="number"
                    min={4}
                    max={10}
                    value={gWordSearchCount}
                    onChange={(e) => setGWordSearchCount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Challenge questions (admin sets the correct answer)
                  </p>
                  {gChallengePrompts.map((prompt, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">Question {i + 1}</p>
                      <input
                        value={prompt}
                        onChange={(e) => {
                          const next = [...gChallengePrompts];
                          next[i] = e.target.value;
                          setGChallengePrompts(next);
                        }}
                        placeholder="Prompt"
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                      {[0, 1, 2, 3].map((oi) => (
                        <input
                          key={oi}
                          value={gChallengeOpts[i]?.[oi] ?? ""}
                          onChange={(e) => {
                            const next = [...gChallengeOpts];
                            const row = [...(next[i] || ["", "", "", ""])];
                            row[oi] = e.target.value;
                            next[i] = row;
                            setGChallengeOpts(next);
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      ))}
                      <label className="mt-2 block text-sm">
                        Correct option (1–4)
                        <select
                          value={gChallengeCorrect[i] ?? 0}
                          onChange={(e) => {
                            const next = [...gChallengeCorrect];
                            next[i] = Number(e.target.value);
                            setGChallengeCorrect(next);
                          }}
                          className="ml-2 rounded border border-slate-200 px-2 py-1"
                        >
                          {[0, 1, 2, 3].map((j) => (
                            <option key={j} value={j}>
                              {j + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <textarea
                        value={gChallengeExplanations[i] || ""}
                        onChange={(e) => {
                          const next = [...gChallengeExplanations];
                          next[i] = e.target.value;
                          setGChallengeExplanations(next);
                        }}
                        placeholder="Optional explanation shown after checking"
                        rows={2}
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addChallengeQuestion} className="text-sm text-teal-700 hover:underline">
                    + Add challenge question
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : editingGameId ? "Save game" : "Create game"}
              </button>
            </form>
          </section>
          }
        />
      ) : null}

      {segment === "vocabulary" ? (
        <BrowseEditorLayout
          list={
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Vocabulary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These words power <strong>Match pairs</strong>, <strong>Word scramble</strong> (vocabulary mode), and{" "}
                  <strong>Word search</strong>.
                </p>
              </div>
              <div className={listPanelScroll}>
                {vocabList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                    No vocabulary yet. Add one on the right — then your scramble/word search games will work.
                  </p>
                ) : (
                  pagedVocabList.map((w) => (
                    <ListCard
                      key={w._id}
                      title={`${w.english} — ${w.filipino} — ${w.bikol}`}
                      subtitle={w.tags?.length ? `tags: ${w.tags.join(", ")}` : undefined}
                      badge={w.example ? "Has example" : undefined}
                      onEdit={() => loadVocabForEdit(w)}
                      onDelete={() => void deleteVocab(w._id, w.english || w.bikol || "word")}
                    />
                  ))
                )}
              </div>
              <PaginationBar
                page={contentListPage}
                pageSize={CONTENT_PAGE_SIZE}
                totalItems={vocabList.length}
                onPageChange={setContentListPage}
              />
            </>
          }
          editor={
            <section className="rounded-2xl border-2 border-dashed border-amber-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-amber-900">
                  {editingVocabId ? "Edit vocabulary word" : "Add a vocabulary word"}
                </h2>
                {editingVocabId ? (
                  <button
                    type="button"
                    onClick={resetVocabForm}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
              <form onSubmit={submitVocab} className="space-y-4">
                <label className="block text-sm">
                  <span className="text-slate-600">English</span>
                  <input
                    value={vEnglish}
                    onChange={(e) => setVEnglish(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Filipino</span>
                  <input
                    value={vFilipino}
                    onChange={(e) => setVFilipino(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Bikol</span>
                  <input
                    value={vBikol}
                    onChange={(e) => setVBikol(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Example (optional)</span>
                  <input
                    value={vExample}
                    onChange={(e) => setVExample(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Tags (comma-separated)</span>
                  <input
                    value={vTags}
                    onChange={(e) => setVTags(e.target.value)}
                    placeholder="basic, food, greetings"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Saving…" : editingVocabId ? "Save word" : "Add word"}
                </button>
              </form>
            </section>
          }
        />
      ) : null}
        </div>
      </div>
    </div>
  );
}
