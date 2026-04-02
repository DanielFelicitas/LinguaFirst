import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function usePageAnalytics() {
  const { user } = useAuth();
  const location = useLocation();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const path = location.pathname + location.search;
    if (last.current === path) return;
    last.current = path;
    void api
      .analytics({ name: "page_view", path, meta: { title: document.title } })
      .catch(() => {});
  }, [user, location.pathname, location.search]);
}
