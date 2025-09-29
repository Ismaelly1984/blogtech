#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

function loadMarked() {
  try {
    const mod = require('marked');
    return typeof mod.marked === 'function' ? mod.marked : mod;
  } catch (error) {
    return null;
  }
}

const marked = loadMarked();

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(content = '') {
  return /<[^>]+>/.test(content.trim());
}

function basicMarkdownToHtml(markdown = '') {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split(/\n{2,}/);

  const blocks = lines.map((block) => {
    const trimmed = block.trim();

    if (!trimmed) return '';

    if (/^```/.test(trimmed)) {
      const languageMatch = trimmed.match(/^```(\w+)?/);
      const language = languageMatch && languageMatch[1] ? ` class="language-${languageMatch[1]}"` : '';
      const code = trimmed.replace(/^```\w*\n?/, '').replace(/```$/, '');
      return `<pre><code${language}>${escapeHtml(code)}</code></pre>`;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      return `<h${level}>${inlineMarkdown(text)}</h${level}>`;
    }

    return `<p>${inlineMarkdown(trimmed)}</p>`;
  });

  return blocks.filter(Boolean).join('\n');
}

function inlineMarkdown(text = '') {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderContent(content = '') {
  if (!content.trim()) {
    return '<p class="article-empty">Conteúdo indisponível.</p>';
  }

  if (marked) {
    return marked.parse(content);
  }

  if (looksLikeHtml(content)) {
    return content;
  }

  return basicMarkdownToHtml(content);
}

function createMetaDescription(htmlContent = '') {
  const text = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= 150) {
    return text;
  }

  const slice = text.slice(0, 150).trim();
  const lastSpace = slice.lastIndexOf(' ');
  const candidate = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${candidate.trim()}…`;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildArticleHtml(article, articleContentHtml, metaDescription) {
  const title = escapeHtml(article.title || 'Artigo sem título');
  const author = escapeHtml(article.author || 'Autor desconhecido');
  const isoDate = article.date || '';
  const humanDate = formatDate(isoDate);
  const dateMarkup = isoDate
    ? `<time class="article-date" datetime="${escapeHtml(isoDate)}">${escapeHtml(humanDate)}</time>`
    : '';
  const authorMarkup = article.author ? `<span class="article-author">por ${author}</span>` : '';

  const tagsMarkup = Array.isArray(article.tags) && article.tags.length
    ? `<ul class="article-tags">${article.tags
        .map((tag) => `<li class="article-tag">${escapeHtml(String(tag))}</li>`)
        .join('')}</ul>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="stylesheet" href="../css/blog-base.css" />
  <link rel="stylesheet" href="../css/article.css" />
</head>
<body>
  <header class="site-header">
    <nav class="site-nav">
      <a class="back-link" href="../blog.html">Voltar ao Blog</a>
    </nav>
  </header>
  <main class="article-main">
    <article class="article-content-wrapper">
      <h1 class="article-title">${title}</h1>
      <div class="article-meta">${[dateMarkup, authorMarkup].filter(Boolean).join(' • ')}</div>
      <div class="article-content">${articleContentHtml}</div>
      ${tagsMarkup}
    </article>
  </main>
  <footer class="site-footer">
    <p class="footer-copy">&copy; ${new Date().getFullYear()} BlogTech. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;
}

async function main() {
  const baseDir = __dirname;
  const articlesPath = path.join(baseDir, 'articles.json');
  const postsDir = path.join(baseDir, 'posts');

  const raw = await fs.readFile(articlesPath, 'utf-8');
  const articles = JSON.parse(raw);

  await fs.mkdir(postsDir, { recursive: true });

  if (!Array.isArray(articles)) {
    throw new Error('O arquivo articles.json deve conter uma lista de artigos.');
  }

  const tasks = articles.map(async (article) => {
    const slug = (article.slug || `artigo-${article.id || Date.now()}`).trim();
    if (!slug) {
      throw new Error(`Artigo com id ${article.id} não possui slug válido.`);
    }

    const articleHtml = renderContent(article.content || '');
    const metaDescription = createMetaDescription(articleHtml);
    const fullHtml = buildArticleHtml(article, articleHtml, metaDescription);

    const fileName = `${slug}.html`;
    const filePath = path.join(postsDir, fileName);

    await fs.writeFile(filePath, fullHtml, 'utf-8');
    return fileName;
  });

  const generated = await Promise.all(tasks);

  const missingMarkedMessage = !marked
    ? 'Observação: pacote "marked" não encontrado. Foi usado um conversor Markdown básico. Instale com "npm install marked" para um resultado mais completo.'
    : null;

  console.log(`Gerados ${generated.length} arquivo(s) em "posts/":`);
  generated.forEach((name) => console.log(` - ${name}`));
  if (missingMarkedMessage) {
    console.warn(missingMarkedMessage);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Falha ao gerar posts estáticos:');
    console.error(error);
    process.exit(1);
  });
}
