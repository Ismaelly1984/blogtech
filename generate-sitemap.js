// generate-sitemap.js
const fs = require("fs");
const path = require("path");

// Config
const BASE_URL = "https://ismaelly1984.github.io/blogtech";
const articlesPath = path.join(__dirname, "articles.json");
const sitemapPath = path.join(__dirname, "sitemap.xml");

// Lê artigos
const articles = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));

// Função para formatar data ISO
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// URLs fixas
const staticPages = [
  { loc: `${BASE_URL}/index.html`, priority: "1.0" },
  { loc: `${BASE_URL}/blog.html`, priority: "0.9" }
];

// URLs dos artigos
const articlePages = articles
  .filter(a => a.status === "published")
  .map(a => ({
    loc: `${BASE_URL}/blog-post.html?id=${a.id}`,
    lastmod: formatDate(a.date),
    priority: "0.7"
  }));

// Monta XML
const urls = [...staticPages, ...articlePages]
  .map(u => `
  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
  .join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

// Salva sitemap.xml
fs.writeFileSync(sitemapPath, xml, "utf-8");
console.log("✅ sitemap.xml gerado com sucesso!");
