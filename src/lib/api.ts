import { auth } from "./firebase";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "spartacus-artes-marciais";

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Project-Id": PROJECT_ID,
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let message = `Erro ${res.status}`;
    if (Array.isArray(body.detail)) {
      message = body.detail.map((e: { msg?: string }) => e.msg ?? "").filter(Boolean).join("; ");
    } else if (typeof body.detail === "string") {
      message = body.detail;
    }
    throw new ApiError(message, res.status, body);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
};
