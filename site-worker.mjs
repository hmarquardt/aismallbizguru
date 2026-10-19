// Domain-level redirects require a handler; static _redirects rules match paths only.
const CONTACT_PATH = "/api/contact";
const TO_EMAIL = "hmarquardt+aismallbizguru@gmail.com";
const FROM_EMAIL = "contact@aismallbizguru.com";
const MAX_BODY_BYTES = 16 * 1024;
const NAME_MAX = 100;
const BUSINESS_MAX = 120;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 5000;
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const CATEGORIES = new Map([
  ["website", "Website or online presence"],
  ["software", "Custom business software"],
  ["automation", "Automation and integrations"],
  ["ai", "Artificial intelligence"],
  ["unsure", "Something else / not sure"],
]);

const ALLOWED_ORIGINS = new Set([
  "https://aismallbizguru.com",
  "https://www.aismallbizguru.com",
  "https://aismallbizguru-site.hmarquardt.workers.dev",
  "http://127.0.0.1:8176",
  "http://localhost:8176",
]);

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...extraHeaders,
    },
  });
}

function cleanLine(value) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDescription(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

function validEmail(value) {
  if (value.length > 254 || /[\s<>(),;:"\\]/.test(value)) return false;
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
    value,
  );
}

export function validateInquiry(input) {
  const errors = {};
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { errors: { form: "Send a single inquiry object." } };
  }

  const name = typeof input.name === "string" ? cleanLine(input.name) : "";
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const business =
    typeof input.business === "string" ? cleanLine(input.business) : "";
  const category = typeof input.category === "string" ? input.category : "";
  const description =
    typeof input.description === "string"
      ? cleanDescription(input.description)
      : "";

  if (!name) errors.name = "Please tell us your name.";
  else if (name.length > NAME_MAX)
    errors.name = `Please keep your name under ${NAME_MAX} characters.`;

  if (!email) errors.email = "Please enter an email address.";
  else if (!validEmail(email))
    errors.email = "Please enter a valid email address.";

  if (!CATEGORIES.has(category))
    errors.category = "Please choose an area we can help with.";

  if (description.length < DESCRIPTION_MIN)
    errors.description = `Please add at least ${DESCRIPTION_MIN} characters so we have enough context.`;
  else if (description.length > DESCRIPTION_MAX)
    errors.description = `Please keep the description under ${DESCRIPTION_MAX.toLocaleString("en-US")} characters.`;

  if (business.length > BUSINESS_MAX)
    errors.business = `Please keep the business name under ${BUSINESS_MAX} characters.`;

  return {
    errors,
    value: { name, email, business, category, description },
  };
}

function buildNotification(inquiry, id, timestamp) {
  const subjectName = inquiry.name.slice(0, 80);
  return {
    from: { email: FROM_EMAIL, name: "AI Small Business Guru" },
    to: TO_EMAIL,
    replyTo: { email: inquiry.email, name: inquiry.name },
    subject: `[AI Small Business Guru] New project inquiry — ${subjectName}`,
    text: [
      "New project inquiry",
      "",
      `Submitted: ${timestamp}`,
      `Request ID: ${id}`,
      "",
      `Name: ${inquiry.name}`,
      `Email: ${inquiry.email}`,
      `Business: ${inquiry.business || "Not provided"}`,
      `Category: ${CATEGORIES.get(inquiry.category)}`,
      "",
      "Project description:",
      inquiry.description,
      "",
      `Reply to this message to respond directly to ${inquiry.email}.`,
      "",
    ].join("\n"),
  };
}

async function verifyTurnstile(token, secret, remoteIp) {
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function handleContact(request, env) {
  if (request.method !== "POST")
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405, {
      allow: "POST",
    });

  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin))
    return jsonResponse({ ok: false, error: "Request not allowed." }, 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json"))
    return jsonResponse(
      { ok: false, error: "Send the inquiry as JSON." },
      415,
    );

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES)
    return jsonResponse(
      { ok: false, error: "That message is too large. Please shorten it." },
      413,
    );

  let raw;
  try {
    raw = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: "Could not read the inquiry." }, 400);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
    return jsonResponse(
      { ok: false, error: "That message is too large. Please shorten it." },
      413,
    );

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return jsonResponse({ ok: false, error: "Malformed inquiry." }, 400);
  }

  // Honeypot: a real visitor never fills this hidden field.
  if (typeof input?.website === "string" && input.website.trim())
    return jsonResponse({ ok: false, error: "Submission rejected." }, 400);

  const { errors, value } = validateInquiry(input);
  if (Object.keys(errors).length)
    return jsonResponse(
      {
        ok: false,
        error: "Please check the highlighted fields.",
        fields: errors,
      },
      400,
    );

  if (!env.CONTACT_RATE_LIMIT)
    return jsonResponse(
      { ok: false, error: "The contact form is temporarily unavailable." },
      503,
    );
  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  const { success: withinLimit } = await env.CONTACT_RATE_LIMIT.limit({
    key: `contact:${clientIp}`,
  });
  if (!withinLimit)
    return jsonResponse(
      {
        ok: false,
        error:
          "Too many attempts. Please wait a minute or email us directly at contact@aismallbizguru.com.",
      },
      429,
    );

  const token =
    typeof input.turnstileToken === "string" ? input.turnstileToken.trim() : "";
  if (!token || token.length > 2048)
    return jsonResponse(
      {
        ok: false,
        error:
          "Please complete the verification, or email us directly at contact@aismallbizguru.com.",
      },
      403,
    );
  if (!env.TURNSTILE_SECRET)
    return jsonResponse(
      { ok: false, error: "The contact form is temporarily unavailable." },
      503,
    );
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET, clientIp)))
    return jsonResponse(
      {
        ok: false,
        error:
          "Verification failed. Please try again, or email us directly at contact@aismallbizguru.com.",
      },
      403,
    );

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const message = buildNotification(value, id, timestamp);

  try {
    if (!env.SEND_EMAIL) throw new Error("SEND_EMAIL binding is missing");
    await env.SEND_EMAIL.send(message);
  } catch (error) {
    // Log only the request ID and provider error code, never the inquiry.
    console.error("contact_send_failed", {
      id,
      code: error && error.code ? String(error.code) : "unknown",
    });
    return jsonResponse(
      {
        ok: false,
        error:
          "We couldn't send your message right now. Please try again, or email us directly at contact@aismallbizguru.com.",
      },
      502,
    );
  }

  console.log("contact_accepted", { id });
  return jsonResponse({ ok: true, id });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isWww = url.hostname === "www.aismallbizguru.com";
    const hasGuideTrailingSlash = url.pathname === "/getting-started/";
    if (isWww || hasGuideTrailingSlash) {
      if (isWww) {
        url.protocol = "https:";
        url.hostname = "aismallbizguru.com";
        url.port = "";
      }
      if (hasGuideTrailingSlash) url.pathname = "/getting-started";
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname === CONTACT_PATH) return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};

