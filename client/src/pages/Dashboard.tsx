import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, type NoteOut, type ProgressOut } from "@/lib/api";

export function Dashboard() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<NoteOut[]>([]);
  const [progress, setProgress] = useState<ProgressOut[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.notes.list(), api.progress.list()])
      .then(([n, p]) => {
        setNotes(n.notes);
        setProgress(p.progress);
      })
      .catch((e: Error) => setErr(e.message));
  }, [user]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const { note } = await api.notes.create({ title: noteTitle, body: noteBody });
      setNotes((prev) => [note, ...prev]);
      setNoteTitle("");
      setNoteBody("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const completed = progress.filter((x) => x.completed).length;

  return (
    <div className="space-y-10">
      <div>
        <h1
          className="text-3xl font-semibold text-slate-800 md:text-4xl"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Your progress
        </h1>
        <p className="mt-2 text-slate-600">
          Signed in as <span className="text-slate-900">{user.email}</span>
          {user.role === "admin" ? (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Admin
            </span>
          ) : null}
        </p>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-teal-700">Lessons completed</h2>
          <p className="mt-2 text-4xl font-bold text-slate-800">{completed}</p>
          <Link to="/lessons" className="mt-4 inline-block text-sm text-rose-600 hover:underline">
            Continue lessons →
          </Link>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-teal-700">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/quiz" className="text-slate-600 hover:text-teal-700">
                Quizzes
              </Link>
            </li>
            <li>
              <Link to="/games" className="text-slate-600 hover:text-teal-700">
                Games
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2
          className="text-xl font-semibold text-slate-800"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Notes
        </h2>
        <form onSubmit={addNote} className="mt-4 space-y-3">
          <input
            placeholder="Title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
          />
          <textarea
            placeholder="Write a note…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Save note
          </button>
        </form>
        <ul className="mt-6 space-y-3">
          {notes.map((n) => (
            <li key={n._id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <p className="font-medium text-slate-900">{n.title}</p>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{n.body}</p>
            </li>
          ))}
        </ul>
        {notes.length === 0 ? <p className="mt-4 text-sm text-slate-500">No notes yet.</p> : null}
      </section>

      {user.role === "admin" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Admin</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add lessons (flipbook or simple), quizzes (multiple choice or true/false), and games (match pairs or word
            scramble) from the content tool.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/content"
              className="inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Manage lessons, quizzes & games
            </Link>
            <Link
              to="/admin/essay-submissions"
              className="inline-block rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              View essay submissions
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
