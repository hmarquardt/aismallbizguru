document.documentElement.classList.add("js");
const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
toggle.hidden = false;
function closeMenu(returnFocus = false) {
  toggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  if (returnFocus) toggle.focus();
}
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
});
navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  closeMenu();
  if (!link.hash) return;
  const target = document.querySelector(link.hash);
  if (target) {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true")
    closeMenu(true);
});
window
  .matchMedia("(min-width: 901px)")
  .addEventListener("change", () => closeMenu());
