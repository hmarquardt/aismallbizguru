const form = document.querySelector("#contact-form");
const status = document.querySelector("#form-status");
const success = document.querySelector("#contact-success");
const submit = form.querySelector(".submit-button");
const turnstileContainer = form.querySelector(".cf-turnstile");
const verificationError = document.querySelector("#verification-error");
const fields = ["name", "email", "business", "category", "description"];
let widgetId = null;
let turnstileToken = "";
let submitting = false;
let submissionTracked = false;

function field(name) {
  return form.elements.namedItem(name);
}

function showError(name, message) {
  const input = field(name);
  const output = document.querySelector(`#${name}-error`);
  if (!input || !output) return;
  output.textContent = message || "";
  output.hidden = !message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function clearErrors() {
  for (const name of fields) showError(name, "");
  verificationError.textContent = "";
  verificationError.hidden = true;
}

function setStatus(message) {
  status.textContent = message;
  status.hidden = !message;
  if (message) status.focus();
}

function validEmail(value) {
  return (
    value.length <= 254 &&
    !/[\s<>(),;:"\\]/.test(value) &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
      value,
    )
  );
}

function validate() {
  clearErrors();
  const name = field("name").value.trim();
  const email = field("email").value.trim();
  const business = field("business").value.trim();
  const category = field("category").value;
  const description = field("description").value.trim();
  let firstInvalid = null;

  const fail = (key, message) => {
    showError(key, message);
    if (!firstInvalid) firstInvalid = field(key);
  };

  if (!name) fail("name", "Please tell us your name.");
  else if (name.length > 100)
    fail("name", "Please keep your name under 100 characters.");

  if (!email) fail("email", "Please enter an email address.");
  else if (!validEmail(email))
    fail("email", "Please enter a valid email address.");

  if (business.length > 120)
    fail("business", "Please keep the business name under 120 characters.");

  if (!["website", "software", "automation", "ai", "unsure"].includes(category))
    fail("category", "Please choose an area we can help with.");

  if (description.length < 20)
    fail(
      "description",
      "Please add at least 20 characters so we have enough context.",
    );
  else if (description.length > 5000)
    fail("description", "Please keep the description under 5,000 characters.");

  if (firstInvalid) {
    firstInvalid.focus();
    return null;
  }
  return { name, email, business, category, description };
}

function renderTurnstile() {
  if (!window.turnstile || widgetId !== null) return;
  widgetId = window.turnstile.render(turnstileContainer, {
    sitekey: turnstileContainer.dataset.sitekey,
    action: "contact",
    theme: "light",
    callback: (token) => {
      turnstileToken = token;
      verificationError.textContent = "";
      verificationError.hidden = true;
    },
    "expired-callback": () => {
      turnstileToken = "";
    },
    "error-callback": () => {
      turnstileToken = "";
      verificationError.textContent =
        "Verification couldn't load. Please refresh, or email us directly at contact@aismallbizguru.com.";
      verificationError.hidden = false;
    },
  });
}

if (window.turnstile) {
  renderTurnstile();
} else {
  const script = document.createElement("script");
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.onload = renderTurnstile;
  script.onerror = () => {
    verificationError.textContent =
      "Verification couldn't load. Please email us directly at contact@aismallbizguru.com.";
    verificationError.hidden = false;
  };
  document.head.append(script);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;

  const values = validate();
  if (!values) return;

  const token =
    (window.turnstile &&
      widgetId !== null &&
      window.turnstile.getResponse(widgetId)) ||
    turnstileToken;
  if (!token) {
    verificationError.textContent =
      "Please complete the verification, or email us directly at contact@aismallbizguru.com.";
    verificationError.hidden = false;
    turnstileContainer.scrollIntoView({ block: "center" });
    return;
  }

  submitting = true;
  submit.disabled = true;
  submit.setAttribute("aria-busy", "true");
  submit.textContent = "Sending…";
  setStatus("");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, turnstileToken: token }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.ok) {
      // Only the endpoint's confirmed success counts as a conversion. The guard
      // prevents a duplicate if this handler is re-entered for the same inquiry;
      // failures and blocked submissions never reach this branch.
      if (!submissionTracked) {
        submissionTracked = true;
        if (window.aismallbizguruAnalytics)
          window.aismallbizguruAnalytics.track("contact_submit", {
            category: values.category,
          });
      }
      form.hidden = true;
      success.hidden = false;
      success.setAttribute("tabindex", "-1");
      success.focus();
      return;
    }

    if (result.fields) {
      for (const [name, message] of Object.entries(result.fields))
        if (fields.includes(name)) showError(name, message);
    }
    setStatus(
      result.error ||
        "We couldn't send your message. Please try again, or email us directly at contact@aismallbizguru.com.",
    );
  } catch {
    setStatus(
      "We couldn't reach the server. Please check your connection and try again, or email us directly at contact@aismallbizguru.com.",
    );
  } finally {
    clearTimeout(timer);
    submitting = false;
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
    submit.textContent = "Send inquiry →";
    if (window.turnstile && widgetId !== null) {
      window.turnstile.reset(widgetId);
      turnstileToken = "";
    }
  }
});

