// blog.js – Listagem de artigos com busca + paginação + imagens responsivas
(function () {
  const POSTS_PER_PAGE = 6;
  let allArticles = [];
  let currentPage = 1;
  let filteredArticles = [];

  const container = document.getElementById("articles-container");
  const paginationContainer = document.createElement("div");
  paginationContainer.className = "pagination";

  if (!container) return;

  // Util: cria <picture> responsivo
  function buildResponsiveImage(article) {
    const baseUrl = new URL(article.image, location.origin).href;
    return `
      <div class="post-image">
        <picture>
          <source 
            type="image/webp" 
            srcset="${baseUrl}-400.webp 400w, ${baseUrl}-800.webp 800w" 
            sizes="(max-width: 768px) 100vw, 400px">
          <source 
            type="image/jpeg" 
            srcset="${baseUrl}-400.jpg 400w, ${baseUrl}-800.jpg 800w" 
            sizes="(max-width: 768px) 100vw, 400px">
          <img 
            src="${baseUrl}-400.jpg" 
            alt="${article.imageAlt || article.title}" 
            width="400" height="225"
            loading="lazy" decoding="async">
        </picture>
      </div>
    `;
  }

  // Classe de categoria
  function getCategoryClass(category) {
    const c = (category || "").toLowerCase();
    if (c.includes("react")) return "category-react";
    if (c.includes("carreira")) return "category-carreira";
    if (c.includes("ia")) return "category-ia";
    if (c.includes("pwa")) return "category-pwa";
    return "category-default";
  }

  // Renderizar artigos
  function renderArticles(articles, clear = true) {
    if (clear) container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    articles.forEach(article => {
      const card = document.createElement("article");
      card.className = "post-card" + (article.featured ? " featured" : "");
      card.innerHTML = `
        ${buildResponsiveImage(article)}
        <div class="post-title-banner ${getCategoryClass(article.category)}">
          <h2><a href="blog-post.html?id=${article.id}">${article.title}</a></h2>
        </div>
        <div class="post-content">
          <p class="post-excerpt">${article.excerpt}</p>
          <div class="post-meta">
            <span class="post-author">
              <img src="images/avatar-ismael.jpg" alt="Foto de ${article.author}" class="author-avatar">
              ${article.author}
            </span>
            <span>${article.date}</span>
            <span>${article.readTime}</span>
          </div>
          <div class="tags">
            ${(article.tags || [])
              .map(tag => `<a href="blog.html?tag=${encodeURIComponent(tag.toLowerCase())}" class="tag">#${tag}</a>`)
              .join(" ")}
          </div>
          <a href="blog-post.html?id=${article.id}" 
             class="read-more" 
             aria-label="Ler mais sobre ${article.title}">
            Ler mais <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `;
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  // Renderizar paginação
  function renderPagination(totalPages) {
    paginationContainer.innerHTML = "";
    if (totalPages <= 1) return;

    function addButton(label, page, disabled = false, active = false) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.className = active ? "page-numbers current" : "page-numbers";
      btn.disabled = disabled;
      btn.setAttribute("aria-label", `Página ${page}`);
      btn.addEventListener("click", () => {
        if (!disabled && currentPage !== page) {
          currentPage = page;
          updateUI();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      paginationContainer.appendChild(btn);
    }

    addButton("«", currentPage - 1, currentPage === 1);
    for (let i = 1; i <= totalPages; i++) {
      addButton(i, i, false, i === currentPage);
    }
    addButton("»", currentPage + 1, currentPage === totalPages);

    if (!paginationContainer.parentNode) {
      container.parentNode.appendChild(paginationContainer);
    }
  }

  // Atualizar UI
  function updateUI() {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    renderArticles(filteredArticles.slice(start, end));
    renderPagination(Math.ceil(filteredArticles.length / POSTS_PER_PAGE));
  }

  // Aplicar filtros
  function applyFilter() {
    const term = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get("tag");

    filteredArticles = allArticles.filter(a => {
      const title = a.title.toLowerCase();
      const tags = (a.tags || []).map(t => t.toLowerCase());
      const matchSearch = term ? (title.includes(term) || tags.some(t => t.includes(term))) : true;
      const matchTag = tagParam ? tags.includes(tagParam.toLowerCase()) : true;
      return matchSearch && matchTag;
    });

    currentPage = 1;
    updateUI();
  }

  // Buscar artigos
  fetch("articles.json", { cache: "force-cache" })
    .then(res => res.json())
    .then(data => {
      allArticles = data
        .filter(a => a.status === "published")
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      filteredArticles = [...allArticles];
      applyFilter();
    })
    .catch(err => {
      console.error("Erro ao carregar artigos:", err);
      container.innerHTML = "<p role='alert'>Erro ao carregar artigos. Tente novamente mais tarde.</p>";
    });

  // Busca com debounce
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    const debounce = (fn, delay = 300) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    };
    searchInput.addEventListener("input", debounce(() => {
      const params = new URLSearchParams(window.location.search);
      params.set("search", searchInput.value.trim());
      history.replaceState(null, "", "?" + params.toString());
      applyFilter();
    }, 300));
  }
})();
