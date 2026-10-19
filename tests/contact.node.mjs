import test from "node:test";
import assert from "node:assert/strict";
import worker, { validateInquiry } from "../site-worker.mjs";

const URL_CONTACT = "https://aismallbizguru.com/api/contact";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const valid = {
  name: "Alex Rivera",
  email: "alex@example.com",
  business: "Rivera Bakery",
  category: "automation",
  description: "We retype every wholesale order into a spreadsheet and want to stop.",
  turnstileToken: "good-token",
};

function request(body, options = {}) {
  const method = options.method || "POST";
  const headers = {
    "content-type": "application/json",
    "cf-connecting-ip": "203.0.113.10",
    ...(options.headers || {}),
  };
  return new Request(URL_CONTACT, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

function environment(overrides = {}) {
  const sent = [];
  const env = {
    TURNSTILE_SECRET: "test-secret",
    ASSETS: { fetch: () => new Response("asset") },
    CONTACT_RATE_LIMIT: { limit: async () => ({ success: true }) },
    SEND_EMAIL: {
      send: async (message) => {
        sent.push(message);
        return { messageId: "provider-message-id" };
      },
    },
    ...overrides,
  };
  return { env, sent };
}

async function withTurnstile(t, handler) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url) === VERIFY_URL) return handler(init);
    return original(url, init);
  };
  t.after(() => {
    globalThis.fetch = original;
  });
}

function turnstileOk(init) {
  const token = init.body.get("response");
  assert.equal(init.body.get("secret"), "test-secret");
  assert.ok(init.body.get("remoteip"));
  return Response.json({
    success: token !== "bad-token",
    "error-codes": token === "bad-token" ? ["invalid-input-response"] : [],
  });
}

test("a valid inquiry sends exactly one notification to the fixed inbox", async (t) => {
  await withTurnstile(t, async () => Response.json({ success: true }));
  const { env, sent } = environment();
  const response = await worker.fetch(request(valid), env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.match(result.id, /^[0-9a-f-]{36}$/);
  assert.equal(sent.length, 1);

  const message = sent[0];
  assert.deepEqual(message.from, {
    email: "contact@aismallbizguru.com",
    name: "AI Small Business Guru",
  });
  assert.equal(message.to, "hmarquardt+aismallbizguru@gmail.com");
  assert.deepEqual(message.replyTo, {
    email: "alex@example.com",
    name: "Alex Rivera",
  });
  assert.equal(
    message.subject,
    "[AI Small Business Guru] New project inquiry — Alex Rivera",
  );
  for (const expected of [
    "Submitted:",
    "Request ID:",
    "Name: Alex Rivera",
    "Email: alex@example.com",
    "Business: Rivera Bakery",
    "Category: Automation and integrations",
    "We retype every wholesale order",
    "Reply to this message",
  ]) {
    assert(message.text.includes(expected), `Notification is missing ${expected}`);
  }
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("missing required fields return field errors and send nothing", async (t) => {
  let verified = false;
  await withTurnstile(t, async () => {
    verified = true;
    return Response.json({ success: true });
  });
  const { env, sent } = environment();
  const response = await worker.fetch(request({}), env);
  assert.equal(response.status, 400);
  const result = await response.json();
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.fields).sort(), [
    "category",
    "description",
    "email",
    "name",
  ]);
  assert.equal(verified, false);
  assert.equal(sent.length, 0);
});

test("invalid category and oversized description are rejected", async () => {
  const badCategory = validateInquiry({ ...valid, category: "crypto" });
  assert.equal(
    badCategory.errors.category,
    "Please choose an area we can help with.",
  );
  const tooLong = validateInquiry({ ...valid, description: "x".repeat(5001) });
  assert.match(tooLong.errors.description, /5,000 characters/);
});

test("malformed JSON and oversized bodies are rejected", async () => {
  const { env, sent } = environment();
  const malformed = await worker.fetch(request("{not json"), env);
  assert.equal(malformed.status, 400);

  const oversized = await worker.fetch(
    request({ ...valid, description: "x".repeat(17000) }),
    env,
  );
  assert.equal(oversized.status, 413);
  assert.equal(sent.length, 0);
});

test("unsupported methods and content types are rejected", async () => {
  const { env } = environment();
  const get = await worker.fetch(request(null, { method: "GET" }), env);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");

  const text = await worker.fetch(
    request("hello", { headers: { "content-type": "text/plain" } }),
    env,
  );
  assert.equal(text.status, 415);
});

test("missing and invalid Turnstile tokens are rejected server-side", async (t) => {
  await withTurnstile(t, turnstileOk);
  const { env, sent } = environment();
  const missing = await worker.fetch(
    request({ ...valid, turnstileToken: "" }),
    env,
  );
  assert.equal(missing.status, 403);
  assert.equal(sent.length, 0);

  const invalid = await worker.fetch(
    request({ ...valid, turnstileToken: "bad-token" }),
    env,
  );
  assert.equal(invalid.status, 403);
  assert.equal(sent.length, 0);
});

test("a replayed token is rejected", async (t) => {
  await withTurnstile(t, async () =>
    Response.json({
      success: false,
      "error-codes": ["timeout-or-duplicate"],
    }),
  );
  const { env, sent } = environment();
  const response = await worker.fetch(request(valid), env);
  assert.equal(response.status, 403);
  assert.equal(sent.length, 0);
});

test("Turnstile timeout fails closed", async (t) => {
  await withTurnstile(t, async () => {
    throw new DOMException("aborted", "AbortError");
  });
  const { env, sent } = environment();
  const response = await worker.fetch(request(valid), env);
  assert.equal(response.status, 403);
  assert.equal(sent.length, 0);
});

test("provider rejection returns 502 without leaking details or content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true });
  const originalError = console.error;
  console.error = () => {};
  try {
    const { env } = environment({
      SEND_EMAIL: {
        send: async () => {
          const error = new Error("550 recipient rejected");
          error.code = "E_DELIVERY_FAILED";
          throw error;
        },
      },
    });
    const response = await worker.fetch(request(valid), env);
    assert.equal(response.status, 502);
    const result = await response.json();
    assert.equal(result.ok, false);
    assert(!result.error.includes("550"));
    assert(!result.error.includes("provider"));
    assert(result.error.includes("contact@aismallbizguru.com"));
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test("provider timeout is reported as a failure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true });
  const originalError = console.error;
  console.error = () => {};
  try {
    const { env } = environment({
      SEND_EMAIL: {
        send: async () => {
          throw new DOMException("timed out", "TimeoutError");
        },
      },
    });
    const response = await worker.fetch(request(valid), env);
    assert.equal(response.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test("header injection through name and email is neutralized", async (t) => {
  await withTurnstile(t, turnstileOk);
  const { env, sent } = environment();
  const response = await worker.fetch(
    request({ ...valid, name: "Alex\r\nBcc: attacker@example.com" }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
  assert(!sent[0].subject.includes("\n"));
  assert(!sent[0].subject.includes("\r"));
  assert.equal(sent[0].to, "hmarquardt+aismallbizguru@gmail.com");

  const injectedEmail = await worker.fetch(
    request({ ...valid, email: "alex@example.com\r\nBcc: attacker@example.com" }),
    env,
  );
  assert.equal(injectedEmail.status, 400);
  assert.equal(sent.length, 1);
});

test("visitor-supplied recipients are ignored", async (t) => {
  await withTurnstile(t, turnstileOk);
  const { env, sent } = environment();
  const response = await worker.fetch(
    request({
      ...valid,
      to: "attacker@example.com",
      bcc: "attacker@example.com",
      replyTo: "attacker@example.com",
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "hmarquardt+aismallbizguru@gmail.com");
  assert.equal(sent[0].bcc, undefined);
  assert.deepEqual(sent[0].replyTo, {
    email: "alex@example.com",
    name: "Alex Rivera",
  });
});

test("honeypot fills and rate limits are rejected", async (t) => {
  await withTurnstile(t, turnstileOk);
  const { env, sent } = environment();
  const honey = await worker.fetch(request({ ...valid, website: "spam" }), env);
  assert.equal(honey.status, 400);
  assert.equal(sent.length, 0);

  const limited = environment({
    CONTACT_RATE_LIMIT: { limit: async () => ({ success: false }) },
  });
  const throttled = await worker.fetch(request(valid), limited.env);
  assert.equal(throttled.status, 429);
  assert.equal(limited.sent.length, 0);
});

test("a disallowed origin and missing bindings fail closed", async () => {
  const { env } = environment();
  const origin = await worker.fetch(
    request(valid, { headers: { origin: "https://attacker.example" } }),
    env,
  );
  assert.equal(origin.status, 403);

  const { env: noLimiter } = environment({ CONTACT_RATE_LIMIT: undefined });
  const noRate = await worker.fetch(request(valid), noLimiter);
  assert.equal(noRate.status, 503);
});

test("non-contact routes still reach static assets", async () => {
  const response = await worker.fetch(
    new Request("https://aismallbizguru.com/contact"),
    { ASSETS: { fetch: () => new Response("contact page") } },
  );
  assert.equal(await response.text(), "contact page");
});

