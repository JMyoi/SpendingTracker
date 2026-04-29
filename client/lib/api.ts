const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  message: string;
  user: AuthUser;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

export function loginUser(email: string, password: string) {
  return postJson<AuthResponse>("/users/login", { email, password });
}

export function registerUser(username: string, email: string, password: string) {
  return postJson<AuthResponse>("/users/register", {
    username,
    email,
    password,
  });
}

export function storeCurrentUser(user: AuthUser) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}
