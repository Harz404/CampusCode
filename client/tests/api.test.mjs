import assert from "node:assert/strict";
import { test } from "node:test";
import { apiFetch, apiJson } from "../src/lib/api.js";

test("API helper authenticates local requests, preserves options, and does not attach credentials externally", async () => {
    const previous = { fetch: globalThis.fetch, localStorage: globalThis.localStorage };
    globalThis.localStorage = { getItem: () => "test-token" };
    const requests = [];
    globalThis.fetch = async (input, options) => {
        requests.push({ input, options });
        return new Response(JSON.stringify({ error: "Not permitted" }), { status: 403 });
    };
    try {
        const controller = new AbortController();
        await apiFetch("/api/projects", { signal: controller.signal, headers: { "X-Test": "kept" } });
        assert.equal(requests[0].options.headers.get("Authorization"), "Bearer test-token");
        assert.equal(requests[0].options.headers.get("X-Test"), "kept");
        assert.equal(requests[0].options.signal, controller.signal);
        await apiFetch("https://example.com/api/projects");
        assert.equal(requests[1].options.headers.has("Authorization"), false);
        await assert.rejects(apiJson("/api/projects"), /Not permitted/);
    } finally {
        globalThis.fetch = previous.fetch;
        if (previous.localStorage === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = previous.localStorage;
    }
});

test("only local authentication failures notify session expiry; service outages do not", async () => {
    const previous = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, dispatchEvent: globalThis.dispatchEvent, CustomEvent: globalThis.CustomEvent };
    const events = [];
    globalThis.localStorage = { getItem: () => "session-token" };
    globalThis.dispatchEvent = event => events.push(event);
    globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
    let status = 503;
    globalThis.fetch = async () => new Response("{}", { status });
    try {
        await apiFetch("/api/projects"); assert.equal(events.length, 0);
        status = 401;
        await apiFetch("/api/projects"); assert.equal(events.length, 1);
        assert.equal(events[0].type, "campuscode:session-expired"); assert.equal(events[0].detail, "session-token");
        await apiFetch("https://example.com/api/projects"); assert.equal(events.length, 1);
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
