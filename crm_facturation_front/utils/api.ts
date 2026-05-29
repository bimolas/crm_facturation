const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Dispatches a custom DOM event so the global ToastProvider can surface
 * a permission-denied message without requiring React context here.
 */
function dispatchPermissionDenied(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("api:permission-denied", { detail: { message } })
    );
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — clear session and redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  // Handle 403 — surface a permission-denied toast without crashing
  if (response.status === 403) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.message || "You don't have permission to perform this action.";
    dispatchPermissionDenied(message);
    throw new ApiError(403, message);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorData?.message || response.statusText || "An error occurred"
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function normalizeAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }
  return url;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: "GET" }),

  post: (endpoint: string, body: unknown, options?: RequestInit) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint: string, body: unknown, options?: RequestInit) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (endpoint: string, body: unknown, options?: RequestInit) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: "DELETE" }),

  uploadFile: async (file: File) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("file", file);

    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}/files/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        errorData?.message || response.statusText || "File upload failed"
      );
    }

    const uploadResult = await response.json();
    return {
      ...uploadResult,
      url: normalizeAssetUrl(uploadResult?.url),
    };
  },
};

export { normalizeAssetUrl };
