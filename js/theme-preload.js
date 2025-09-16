(function () {
  try {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (sysDark ? "dark" : "light");
    root.setAttribute("data-theme", theme);
  } catch (_) {}
})();

