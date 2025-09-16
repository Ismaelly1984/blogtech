// post.js – Página de artigo individual com capa responsiva (fixo 16/9)
(function () {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  const container = document.getElementById("article-content");
  if (!container) return;

  // Skeleton inicial (CLS fix)
  container.classList.add("loading");
  container.innerHTML = `
    <div class="skeleton skel-cover"></div>
    <div class="skeleton skel-title"></div>
    <div class="skeleton skel-meta"></div>
  `;

  // Util: <picture> responsivo
  function buildResponsiveImage(basePath, alt, width = 800, height = 450) {
    const baseUrl = basePath.startsWith("./") ? basePath : `./${basePath}`;
    return `
      <figure class="article-media">
        <picture>
          <source type="image/webp"
                  srcset="${baseUrl}-400.webp 400w, ${baseUrl}-800.webp 800w"
                  sizes="(max-width: 768px) 100vw, 800px">
          <source type="image/jpeg"
                  srcset="${baseUrl}-400.jpg 400w, ${baseUrl}-800.jpg 800w"
                  sizes="(max-width: 768px) 100vw, 800px">
          <img class="article-cover"
               src="${baseUrl}-800.jpg"
               alt="${alt || "Capa do artigo"}"
               width="${width}" height="${height}"
               loading="eager"
               fetchpriority="high"
               decoding="async" />
        </picture>
      </figure>
    `;
  }

  // SEO: injeta/atualiza meta tags dinamicamente
  function setMetaTag(sel, attr, value) {
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      if (sel.startsWith('meta[name="')) {
        const name = sel.match(/meta\[name="(.+?)"\]/)?.[1];
        if (name) el.setAttribute("name", name);
      } else if (sel.startsWith('meta[property="')) {
        const prop = sel.match(/meta\[property="(.+?)"\]/)?.[1];
        if (prop) el.setAttribute("property", prop);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }

  // Render tags
  function renderTags(tags = []) {
    if (!tags.length) return "";
    return `
      <div class="tags">
        ${tags.map(t => `<a class="tag" aria-label="Tag ${t}" href="index.html?tag=${encodeURIComponent(t.toLowerCase())}">#${t}</a>`).join(" ")}
      </div>
    `;
  }

  // Render referências
  function renderReferences(refs = []) {
    if (!refs.length) return "";
    return `
      <aside class="article-references">
        <h3>Referências</h3>
        <ul>
          ${refs.map(u => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a></li>`).join("")}
        </ul>
      </aside>
    `;
  }

 function renderRelated(allArticles, currentArticle) {
  // Base: todos publicados exceto o atual
  const candidates = allArticles.filter(
    a => a.id !== currentArticle.id && a.status === "published"
  );

  // 1. Mesma categoria
  const sameCategory = candidates.filter(a => a.category === currentArticle.category);

  // 2. Mesmas tags
  const byTags = candidates.filter(a =>
    (a.tags || []).some(tag => (currentArticle.tags || []).includes(tag))
  );

  // Junta categoria + tags sem duplicar
  let related = [...sameCategory];
  byTags.forEach(r => {
    if (!related.find(x => x.id === r.id)) related.push(r);
  });

  // 3. Se ainda não tiver 3, completa com os mais recentes
  if (related.length < 3) {
    const fallback = candidates
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    fallback.forEach(f => {
      if (related.length < 3 && !related.find(x => x.id === f.id)) {
        related.push(f);
      }
    });
  }

  // 4. Limita a 3
  related = related.slice(0, 3);

  if (!related.length) return "";

  return `
    <section class="related-posts">
      <h2>Artigos Relacionados</h2>
      <div class="related-grid">
        ${related.map(r => `
          <article class="related-card">
            <div class="related-image">
              <img src="./${r.image}-400.jpg" 
                   alt="${r.imageAlt || r.title}" 
                   loading="lazy" decoding="async">
            </div>
            <div class="related-content">
              <span class="related-category">${r.category}</span>
              <h3><a href="blog-post.html?id=${r.id}">${r.title}</a></h3>
              <p>${r.excerpt}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}


  // Carrega artigos SEM cache
  fetch("./articles.json?v=" + Date.now(), { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar JSON");
      return res.json();
    })
    .then(data => {
      if (!id || isNaN(id)) throw new Error("Artigo inválido");
      const article = data.find(a => a.id === id && a.status === "published");
      if (!article) throw new Error("Artigo não encontrado");

      const purifier = window.DOMPurify;
      const safeTitle = purifier ? purifier.sanitize(String(article.title)) : String(article.title);
      const safeExcerpt = purifier ? purifier.sanitize(String(article.excerpt || article.title)) : String(article.excerpt || article.title);
      const safeAuthor = purifier ? purifier.sanitize(String(article.author || "Ismael Nunes")) : String(article.author || "Ismael Nunes");
      const safeReadTime = purifier ? purifier.sanitize(String(article.readTime || "")) : String(article.readTime || "");

      document.title = `${safeTitle} | Blog – Ismael Nunes`;

      const cover = article.image
        ? buildResponsiveImage(article.image, safeTitle, article.coverW || 800, article.coverH || 450)
        : "";

      const metaHtml = `
        <header class="article-header">
          <h1 class="article-title">${safeTitle}</h1>
          <p class="article-meta">
            <span>${safeAuthor}</span> ·
            <time datetime="${article.date}">${article.date}</time> ·
            <span>${safeReadTime}</span>
          </p>
        </header>
      `;

      let rawContent = article.content || "";
      if (window.marked && typeof window.marked.parse === "function") {
        rawContent = window.marked.parse(rawContent);
      }

      const safeContent = purifier
        ? purifier.sanitize(
            rawContent
              .replaceAll("<table>", '<div class="table-responsive"><table>')
              .replaceAll("</table>", "</table></div>")
          )
        : rawContent;

      const relatedHtml = renderRelated(data, article);

      const pageHtml = `
        ${cover}
        ${metaHtml}
        <div class="article-content">${safeContent}</div>
        ${renderTags(article.tags)}
        ${renderReferences(article.references)}
        ${relatedHtml}
        <a href="index.html" class="back-button" aria-label="Voltar para a lista de artigos">← Voltar ao Blog</a>
      `;

      container.innerHTML = purifier ? purifier.sanitize(pageHtml) : pageHtml;
      container.classList.remove("loading");
      container.removeAttribute("aria-busy");

      if (window.Prism) window.Prism.highlightAll();

      const pageUrl = new URL(window.location.href);
      setCanonical(pageUrl.href);
      setMetaTag('meta[name="description"]', "content", safeExcerpt);
      setMetaTag('meta[property="og:title"]', "content", safeTitle);
      setMetaTag('meta[property="og:description"]', "content", safeExcerpt);

      const ogImage = article.image ? `./${article.image}-800.webp` : "";
      if (ogImage) {
        setMetaTag('meta[property="og:image"]', "content", ogImage);
        setMetaTag('meta[name="twitter:image"]', "content", ogImage);
      }

      setMetaTag('meta[name="twitter:title"]', "content", safeTitle);
      setMetaTag('meta[name="twitter:description"]', "content", safeExcerpt);

      if (article.tags?.length) {
        setMetaTag('meta[name="keywords"]', "content", article.tags.join(", "));
      }
    })
    .catch(err => {
      container.innerHTML = `
        <div class="article-content" role="alert">
          <h2>Artigo não encontrado</h2>
          <p>Ops! O artigo solicitado não foi encontrado.</p>
          <a href="index.html" class="back-button ghost" aria-label="Voltar para a lista de artigos">
            <i class="fas fa-arrow-left" aria-hidden="true"></i> <span>Voltar ao Blog</span>
          </a>
        </div>
      `;
      container.classList.remove("loading");
      console.error(err);
    });
})();
