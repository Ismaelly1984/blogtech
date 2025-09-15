// =====================================
// BLOG BASE JS — global para o Blog
// Funções: Menu mobile + Sistema de temas (Light, Dark, Blue...)
// =====================================

(function () {
  // ---------- Seletores ----------
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.querySelector(".nav-menu");
  const themeSelect = document.getElementById("themeSelect"); // dropdown de temas
  const darkToggle = document.getElementById("darkToggle");   // botão rápido dark/light

  // ---------- Menu Mobile ----------
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      menuToggle.classList.toggle("is-active");
      navMenu.classList.toggle("active");
    });

    // Fecha menu ao clicar num link
    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.classList.remove("is-active");
        navMenu.classList.remove("active");
      });
    });
  }

  // ---------- Sistema de Temas ----------
  const root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeSelect) themeSelect.value = theme; // sincroniza UI do <select>
  }

  // Estado inicial
  try {
    const stored = localStorage.getItem("theme");
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (sysDark ? "dark" : "light");
    setTheme(theme);
  } catch (e) {
    console.warn("Erro ao carregar tema:", e);
  }

  // Toggle manual pelo botão (apenas alterna light/dark)
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
    });
  }

  // Alteração via dropdown (multi-temas)
  if (themeSelect) {
    themeSelect.addEventListener("change", e => {
      setTheme(e.target.value);
    });
  }

  // Reagir a mudanças do sistema (apenas se não houver escolha salva)
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onPrefersColorChange = (e) => {
    const stored = localStorage.getItem("theme");
    if (!stored) {
      setTheme(e.matches ? "dark" : "light");
    }
  };
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onPrefersColorChange);
  } else if (typeof mql.addListener === "function") {
    // Safari antigos
    mql.addListener(onPrefersColorChange);
  }
})();
