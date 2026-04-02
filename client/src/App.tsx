import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Lessons } from "./pages/Lessons";
import { QuizHub } from "./pages/QuizHub";
import { QuizTake } from "./pages/QuizTake";
import { Games } from "./pages/Games";
import { Contact } from "./pages/Contact";
import { About } from "./pages/About";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AdminContent } from "./pages/AdminContent";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/:lessonId" element={<Lessons />} />
        <Route path="quiz" element={<QuizHub />} />
        <Route path="quiz/:id" element={<QuizTake />} />
        <Route path="games" element={<Games />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin/content" element={<AdminContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
