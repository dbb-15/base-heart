// HTTP client centralizado.
// - base '/api' (proxy Vite -> Fastify em localhost:3001)
// - Bearer token injetado pelo SessionProvider
// - credentials: 'include' para refresh cookie HttpOnly
// - refresh automático em 401 (uma tentativa)
// - ApiError tipado

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenGetter = () => string | null;
type TokenSetter = (token: string | null) => void;

let getToken: TokenGetter = () => null;
let setToken: TokenSetter = () => {};
let onUnauthorized: () => void = () => {};

export function configureApi(opts: {
  getToken: TokenGetter;
  setToken: TokenSetter;
  onUnauthorized: () => void;
}) {
  getToken = opts.getToken;
  setToken = opts.setToken;
  onUnauthorized = opts.onUnauthorized;
}

const BASE = "/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // default true
  raw?: boolean; // se true, retorna Response
}

async function doFetch(path: string, opts: RequestOptions): Promise<Response> {
  const { body, auth = true, raw: _raw, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (body !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
  }
  return fetch(`${BASE}${path}`, {
    ...rest,
    headers: h,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parseError(res: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text().catch(() => undefined);
  }
  const message =
    (payload && typeof payload === "object" && "message" in payload
      ? String((payload as { message: unknown }).message)
      : undefined) || `HTTP ${res.status}`;
  return new ApiError(message, res.status, payload);
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as {
      accessToken?: string;
    } | null;
    if (data?.accessToken) {
      setToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await doFetch(path, opts);

  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch(path, opts);
    } else {
      onUnauthorized();
      throw await parseError(res);
    }
  }

  if (opts.raw) return res as unknown as T;
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
