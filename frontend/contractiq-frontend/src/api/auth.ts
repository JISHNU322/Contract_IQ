import { apiClient } from "./client";
import type { User, AuthToken } from "../types";

export async function registerUser(data: {
  email: string;
  password: string;
  full_name: string;
}): Promise<User> {
  const res = await apiClient.post<User>("/auth/register", {
    email: data.email,
    password: data.password,
    full_name: data.full_name,
  });
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<AuthToken> {
  // The backend uses OAuth2PasswordRequestForm, so this must be sent as
  // form-urlencoded data with a "username" field (not JSON, not "email").
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const res = await apiClient.post<AuthToken>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

export async function getCurrentUser(): Promise<User> {
  const res = await apiClient.get<User>("/auth/me");
  return res.data;
}
