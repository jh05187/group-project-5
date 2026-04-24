const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("scamshield_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Could not reach the server. Please wait a moment and try again.");
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}
