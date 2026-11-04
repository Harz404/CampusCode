// Keep credentials on our own API origin; never forward them to external URLs.
export async function apiFetch(input, options = {}) {
    const base = globalThis.location?.origin || "http://localhost";
    const url = new URL(input, base);
    const headers = new Headers(options.headers);
    if (url.origin === new URL(base).origin && url.pathname.startsWith("/api/")) {
        const token = globalThis.localStorage?.getItem("campuscode_jwt");
        if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await globalThis.fetch(input, { ...options, headers });
    if (response.status === 401 && url.origin === new URL(base).origin && url.pathname.startsWith("/api/") && headers.get("Authorization")?.startsWith("Bearer ") && globalThis.dispatchEvent && globalThis.CustomEvent) {
        globalThis.dispatchEvent(new CustomEvent("campuscode:session-expired", { detail: headers.get("Authorization").slice(7) }));
    }
    return response;
}

export async function apiJson(input, options) {
    const response = await apiFetch(input, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || data.error || `Request failed (${response.status})`);
    return data;
}
