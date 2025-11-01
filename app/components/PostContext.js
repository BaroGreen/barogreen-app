// app/components/PostContext.js
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../core/config";

const PostContext = createContext(null);
const PERSIST_KEY = "community_posts:v2";

/* ===== 서버 엔드포인트 후보 (필요시 수정/추가) ===== */
const LIST_ENDPOINTS = [
  `${API_BASE}/api/community/posts`,
  `${API_BASE}/api/posts`,
  // `${API_BASE}/api/app/posts`, // ← 404라 주석 처리
];
const POST_ENDPOINTS = [
  `${API_BASE}/api/community/posts`,
  `${API_BASE}/api/posts`,
  // `${API_BASE}/api/app/posts`, // ← 404라 주석 처리
];
const PUT_ENDPOINTS = (id) => [
  `${API_BASE}/api/community/posts/${id}`,
  `${API_BASE}/api/posts/${id}`,
  // `${API_BASE}/api/app/posts/${id}`,
];
const DELETE_ENDPOINTS = (id, author) => [
  `${API_BASE}/api/community/posts/${id}?author=${encodeURIComponent(author ?? "")}`,
  `${API_BASE}/api/posts/${id}?author=${encodeURIComponent(author ?? "")}`,
  // `${API_BASE}/api/app/posts/${id}?author=${encodeURIComponent(author ?? "")}`,
];

/* ===== 공통 정규화 ===== */
const ts = (v) =>
  typeof v === "number" ? v : isNaN(Date.parse(v)) ? null : Date.parse(v);

function normalizePost(p) {
  return {
    id: p.id ?? p.ID ?? null,
    title: p.title ?? p.TITLE ?? "",
    content: p.content ?? p.CONTENT ?? "",
    author: p.author ?? p.AUTHOR ?? "",
    createdAt: ts(p.createdAt ?? p.CREATED_AT) ?? Date.now(),
    likes: p.likes ?? p.LIKES ?? 0,
    likedBy: p.likedBy ?? p.LIKED_BY ?? [],
    comments: Array.isArray(p.comments ?? p.COMMENTS)
      ? p.comments ?? p.COMMENTS
      : [],
  };
}

function normalizeComment(c) {
  return {
    id: c.id ?? c.ID ?? null,
    postId: c.postId ?? c.POST_ID ?? null,
    author: c.author ?? c.AUTHOR ?? "",
    content: c.content ?? c.CONTENT ?? "",
    createdAt: ts(c.createdAt ?? c.CREATED_AT) ?? Date.now(),
    parentId: c.parentId ?? c.PARENT_ID ?? null,
  };
}

/* ===== 유틸: 다중 후보 요청 ===== */
async function tryGetJson(candidates) {
  let lastErr;
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("json")) return await res.json();
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return []; }
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("GET candidates all failed");
}

async function tryPostJson(candidates, bodyObj) {
  let lastErr;
  const body = JSON.stringify(bodyObj);
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("json")) return await res.json();
        return bodyObj; // 201 without body 대비
      }
      const text = await res.text().catch(() => "");
      lastErr = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("POST candidates all failed");
}

async function tryPutJson(candidates, bodyObj) {
  let lastErr;
  const body = JSON.stringify(bodyObj);
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("json")) return await res.json();
        return bodyObj;
      }
      const text = await res.text().catch(() => "");
      lastErr = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("PUT candidates all failed");
}

async function tryDelete(candidates) {
  let lastErr;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) return true;
      const text = await res.text().catch(() => "");
      lastErr = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("DELETE candidates all failed");
}

/* ===== Provider ===== */
export function PostProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);

  // 1) 캐시 로드
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PERSIST_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setPosts(arr.map(normalizePost));
        }
      } catch (e) {
        console.warn("[posts] cache load fail", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // 2) 서버 목록
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listRaw = await tryGetJson(LIST_ENDPOINTS);
      const list = (Array.isArray(listRaw) ? listRaw : [])
        .map(normalizePost)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setPosts(list);
    } catch (e) {
      console.error("[posts] reload error", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated) reload();
  }, [hydrated, reload]);

  // 3) 캐시 저장
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(posts));
      } catch (e) {
        console.warn("[posts] cache save fail", e);
      }
    })();
  }, [posts, hydrated]);

  /* ───────────── CRUD (Post) ───────────── */
  const addPost = useCallback(async ({ title, content, author }) => {
    // 낙관적 로컬 생성
    const optimistic = {
      id: `tmp-${Date.now()}`,
      title,
      content,
      author,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      comments: [],
    };
    setPosts((prev) => [optimistic, ...prev]);

    // 서버 저장 시도
    try {
      const savedRaw = await tryPostJson(POST_ENDPOINTS, { title, content, author });
      const saved = normalizePost(savedRaw);
      setPosts((prev) => [
        saved,
        ...prev.filter((p) => p.id !== optimistic.id),
      ]);
      return { ok: true, item: saved, server: "remote" };
    } catch (e) {
      // 서버 실패 → 로컬 유지
      console.warn("[posts] addPost server fail, keep local:", e?.message);
      return { ok: true, item: optimistic, server: "local", message: e?.message };
    }
  }, []);

  const updatePost = useCallback(
    async (id, patch, author) => {
      const backup = posts;
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      try {
        const savedRaw = await tryPutJson(PUT_ENDPOINTS(id), { ...patch, author });
        const saved = normalizePost(savedRaw);
        setPosts((prev) => prev.map((p) => (p.id === id ? saved : p)));
        return { ok: true, item: saved };
      } catch (e) {
        setPosts(backup);
        return { ok: false, message: e?.message || "글 수정 실패" };
      }
    },
    [posts]
  );

  const deletePost = useCallback(
    async (id, author) => {
      const backup = posts;
      setPosts((prev) => prev.filter((p) => p.id !== id));
      try {
        await tryDelete(DELETE_ENDPOINTS(id, author));
        return { ok: true };
      } catch (e) {
        setPosts(backup);
        return { ok: false, message: e?.message || "글 삭제 실패" };
      }
    },
    [posts]
  );

  const toggleLike = useCallback((id, userName = "guest") => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const liked = (p.likedBy ?? []).includes(userName);
        const likedBy = liked
          ? p.likedBy.filter((n) => n !== userName)
          : [...(p.likedBy ?? []), userName];
        const likes = liked ? Math.max((p.likes ?? 0) - 1, 0) : (p.likes ?? 0) + 1;
        return { ...p, likedBy, likes };
      })
    );
  }, []);

  /* ───────────── 댓글(Server) ───────────── */
  const syncComments = useCallback(async (postId) => {
    try {
      const listRaw = await tryGetJson([
        `${API_BASE}/api/comments?postId=${encodeURIComponent(postId)}&page=0&size=100`,
        `${API_BASE}/api/posts/${postId}/comments?page=0&size=100`,
      ]);
      const list = (Array.isArray(listRaw) ? listRaw : []).map(normalizeComment);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: list } : p))
      );
      return { ok: true, items: list };
    } catch (e) {
      return { ok: false, message: e?.message };
    }
  }, []);

  const addComment = useCallback(
    async (postId, { author, content, parentId = null }) => {
      const optimistic = {
        id: `c-${Date.now()}`,
        postId,
        author,
        content,
        createdAt: Date.now(),
        parentId,
      };
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments ?? []), optimistic] } : p
        )
      );

      try {
        const savedRaw = await tryPostJson(
          [
            `${API_BASE}/api/comments`,
            `${API_BASE}/api/posts/${postId}/comments`,
          ],
          { postId, author, content, parentId }
        );
        const saved = normalizeComment(savedRaw);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments
                    .filter((c) => c.id !== optimistic.id)
                    .concat(saved),
                }
              : p
          )
        );
        return { ok: true, item: saved };
      } catch (e) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== optimistic.id) }
              : p
          )
        );
        return { ok: false, message: e?.message || "댓글 등록 실패" };
      }
    },
    []
  );

  const clearAll = useCallback(async () => {
    setPosts([]);
    try { await AsyncStorage.removeItem(PERSIST_KEY); } catch {}
  }, []);

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      hydrated,
      reload,
      addPost,
      updatePost,
      deletePost,
      toggleLike,
      addComment,
      syncComments,
      setPosts,
      clearAll,
    }),
    [
      posts,
      loading,
      error,
      hydrated,
      reload,
      addPost,
      updatePost,
      deletePost,
      toggleLike,
      addComment,
      syncComments,
      clearAll,
    ]
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePostContext() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error("usePostContext must be used within a PostProvider");
  return ctx;
}
