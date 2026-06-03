// theme.js — light/dark mode toggle for Billing X (ZBighype)
// Persists choice in localStorage and injects a floating toggle button.

(function () {
  const KEY = "zb_theme"; // 'light' | 'dark'
  const root = document.documentElement;

  // Apply saved theme as early as possible to avoid a flash.
  const saved = localStorage.getItem(KEY);
  if (saved === "light") root.classList.add("light-mode");

  function isLight() {
    return root.classList.contains("light-mode");
  }

  function updateButton(btn) {
    if (!btn) return;
    const light = isLight();
    // Show the icon for the mode you'll switch TO.
    btn.textContent = light ? "🌙" : "☀️";
    btn.setAttribute(
      "aria-label",
      light ? "Switch to dark mode" : "Switch to light mode"
    );
    btn.setAttribute("title", btn.getAttribute("aria-label"));
  }

  function setTheme(light) {
    root.classList.toggle("light-mode", light);
    localStorage.setItem(KEY, light ? "light" : "dark");
  }

  function init() {
    // Avoid duplicate buttons if script loads twice.
    if (document.querySelector(".theme-toggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    updateButton(btn);

    btn.addEventListener("click", () => {
      setTheme(!isLight());
      updateButton(btn);
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
