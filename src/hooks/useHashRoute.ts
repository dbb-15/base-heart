// Hook de roteamento por hash (#/rota/param).
// Retorna a rota atual e utilitário navigate().
import { useEffect, useState, useCallback } from "react";

export interface HashRoute {
  path: string; // "/oportunidades/123"
  segments: string[]; // ["oportunidades", "123"]
  query: URLSearchParams;
}

function parseHash(): HashRoute {
  const raw = typeof window === "undefined" ? "" : window.location.hash;
  const stripped = raw.startsWith("#") ? raw.slice(1) : raw;
  const [pathPart, queryPart = ""] = stripped.split("?");
  const path = pathPart || "/";
  const segments = path.split("/").filter(Boolean);
  return { path, segments, query: new URLSearchParams(queryPart) };
}

export function navigate(path: string, replace = false) {
  const target = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (replace) {
    const url = window.location.href.split("#")[0] + target;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function useHashRoute(): HashRoute & {
  navigate: (path: string, replace?: boolean) => void;
} {
  const [route, setRoute] = useState<HashRoute>(() => parseHash());

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    // garante estado inicial no client após hidratação
    handler();
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const nav = useCallback(
    (path: string, replace = false) => navigate(path, replace),
    [],
  );

  return { ...route, navigate: nav };
}

// Matcher simples para rotas com parâmetros: matchRoute("/oportunidades/:id", route)
export function matchRoute(
  pattern: string,
  route: HashRoute,
): Record<string, string> | null {
  const patternSegs = pattern.split("/").filter(Boolean);
  if (patternSegs.length !== route.segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i];
    const s = route.segments[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(s);
    } else if (p !== s) {
      return null;
    }
  }
  return params;
}
