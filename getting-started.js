// Browser-local checklist progress. No account, network request, or credential storage.
const STORAGE_KEY = "aismallbizguru:getting-started:v1";
const checkboxes = Array.from(document.querySelectorAll("input[data-step]"));
const skipToggles = Array.from(
  document.querySelectorAll("input[data-skip-group]"),
);
const fieldsets = Array.from(document.querySelectorAll("fieldset[data-checklist]"));
const status = document.querySelector("[data-status]");
const progressText = document.querySelector("[data-progress-text]");
const progressBar = document.querySelector("[data-progress-bar]");
const summaryText = document.querySelector("[data-summary-text]");
const knownSteps = new Set(checkboxes.map((input) => input.dataset.step));
const knownGroups = new Set(skipToggles.map((input) => input.dataset.skipGroup));
let state = { checks: {}, skipped: {} };
let storageWorks = true;
let statusTimer;

function setStatus(message) {
  if (!status) return;
  status.textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    status.textContent = "";
  }, 8000);
}

function sanitize(raw) {
  const next = { checks: {}, skipped: {} };
  if (!raw || typeof raw !== "object" || raw.version !== 1) return next;
  const checks = raw.checks && typeof raw.checks === "object" ? raw.checks : {};
  for (const [id, value] of Object.entries(checks)) {
    if (knownSteps.has(id) && value === true) next.checks[id] = true;
  }
  const skipped =
    raw.skipped && typeof raw.skipped === "object" ? raw.skipped : {};
  for (const [group, value] of Object.entries(skipped)) {
    if (knownGroups.has(group) && value === true) next.skipped[group] = true;
  }
  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      state = sanitize(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    storageWorks = false;
  }
}

function save() {
  if (!storageWorks) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, checks: state.checks, skipped: state.skipped }),
    );
  } catch {
    storageWorks = false;
    setStatus(
      "This browser will not save progress. The checklist still works for this visit.",
    );
  }
}

function applyStateToInputs() {
  for (const input of checkboxes) {
    input.checked = state.checks[input.dataset.step] === true;
  }
  for (const toggle of skipToggles) {
    toggle.checked = state.skipped[toggle.dataset.skipGroup] === true;
  }
}

function itemsFor(fieldset) {
  return Array.from(fieldset.querySelectorAll("input[data-step]"));
}

function isSkipped(input) {
  const group = input.dataset.group;
  return Boolean(group && state.skipped[group]);
}

function updateFieldsetStatuses() {
  for (const fieldset of fieldsets) {
    const key = fieldset.dataset.checklist;
    const badge = document.querySelector(
      `[data-checklist-status="${key}"]`,
    );
    if (!badge) continue;
    const items = itemsFor(fieldset);
    const active = items.filter((input) => !isSkipped(input));
    const done = active.filter((input) => state.checks[input.dataset.step]).length;
    badge.classList.toggle("is-complete", active.length > 0 && done === active.length);
    if (active.length === 0) badge.textContent = "Skipped";
    else if (done === active.length) badge.textContent = "Complete";
    else badge.textContent = `${done} of ${active.length}`;
  }
}

function updateSkipPresentation() {
  for (const toggle of skipToggles) {
    const group = toggle.dataset.skipGroup;
    const skipped = Boolean(state.skipped[group]);
    const note = document.querySelector(`[data-skip-note="${group}"]`);
    if (note) {
      if (!note.dataset.defaultText) note.dataset.defaultText = note.textContent.trim();
      note.textContent = skipped
        ? "Skipped — these steps are not counted toward progress."
        : note.dataset.defaultText;
    }
    const card = toggle.closest(".provider-card");
    if (card) card.classList.toggle("is-skipped", skipped);
    for (const input of checkboxes) {
      if (input.dataset.group === group) input.disabled = skipped;
    }
  }
}

function updateRows() {
  for (const input of checkboxes) {
    const label = input.closest(".check-item");
    if (!label) continue;
    const done = input.checked && !isSkipped(input);
    label.classList.toggle("is-done", done);
  }
}

function buildSummary() {
  const active = checkboxes.filter((input) => !isSkipped(input));
  const done = active.filter((input) => input.checked).length;
  const skipped = checkboxes.length - active.length;
  const lines = [
    "AI Small Business Guru — Getting started",
    `Saved ${new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    `Progress: ${done} of ${active.length} applicable steps complete${
      skipped ? ` (${skipped} optional step${skipped === 1 ? "" : "s"} marked not applicable)` : ""
    }.`,
    "",
  ];
  for (const fieldset of fieldsets) {
    const legend = fieldset.querySelector("legend");
    const label = legend && legend.firstChild ? legend.firstChild.textContent.trim() : "Checklist";
    lines.push(label);
    const items = itemsFor(fieldset);
    if (items.length > 0 && items.every((input) => isSkipped(input))) {
      lines.push("  [not applicable]");
    } else {
      for (const input of items) {
        if (isSkipped(input)) continue;
        const text = input.closest(".check-item")?.querySelector(".check-text");
        const message = text ? text.textContent.trim().replace(/\s+/g, " ") : input.dataset.step;
        lines.push(`  [${input.checked ? "x" : " "}] ${message}`);
      }
    }
    lines.push("");
  }
  lines.push(
    "This summary contains checklist status only. No passwords, recovery codes, payment details, or API tokens are stored on this page.",
  );
  return lines.join("\n");
}

function updateSummary() {
  const text = buildSummary();
  if (summaryText) summaryText.textContent = text;
  return text;
}

function updateProgress() {
  const active = checkboxes.filter((input) => !isSkipped(input));
  const done = active.filter((input) => input.checked).length;
  const skipped = checkboxes.length - active.length;
  const percent = active.length ? Math.round((done / active.length) * 100) : 100;
  if (progressBar) {
    progressBar.value = percent;
    progressBar.textContent = `${percent}% complete`;
  }
  if (progressText) {
    if (active.length === 0) {
      progressText.textContent =
        "Every step is optional for this project. Nothing else to track.";
    } else {
      let message = `You've completed ${done} of ${active.length} applicable steps.`;
      if (skipped > 0)
        message += ` ${skipped} optional step${skipped === 1 ? "" : "s"} marked not applicable.`;
      if (done === active.length) message += " Everything applicable is complete.";
      progressText.textContent = message;
    }
  }
}

function update() {
  updateSkipPresentation();
  updateRows();
  updateFieldsetStatuses();
  updateProgress();
  updateSummary();
}

function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy command was rejected");
}

async function copySummary() {
  const text = updateSummary();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      legacyCopy(text);
    }
    setStatus("Summary copied to your clipboard.");
  } catch {
    try {
      legacyCopy(text);
      setStatus("Summary copied to your clipboard.");
    } catch {
      setStatus("Couldn't copy automatically. Use Print summary instead.");
    }
  }
}

for (const input of checkboxes) {
  input.addEventListener("change", () => {
    if (input.checked) state.checks[input.dataset.step] = true;
    else delete state.checks[input.dataset.step];
    update();
    save();
  });
}

for (const toggle of skipToggles) {
  toggle.addEventListener("change", () => {
    const group = toggle.dataset.skipGroup;
    if (toggle.checked) state.skipped[group] = true;
    else delete state.skipped[group];
    update();
    save();
  });
}

document.querySelector("[data-copy-summary]")?.addEventListener("click", copySummary);
document.querySelector("[data-print-summary]")?.addEventListener("click", () => {
  updateSummary();
  window.print();
});
document.querySelector("[data-reset-progress]")?.addEventListener("click", () => {
  if (!window.confirm("Reset all checklist progress in this browser?")) return;
  state = { checks: {}, skipped: {} };
  save();
  applyStateToInputs();
  update();
  setStatus("Progress reset. You can start again at any time.");
});

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  load();
  applyStateToInputs();
  update();
});

load();
applyStateToInputs();
update();
if (!storageWorks) {
  setStatus(
    "This browser will not save progress. The checklist still works for this visit.",
  );
}
