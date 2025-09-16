# BlogTech — Blog de Tecnologia

Site estático do blog “IsmaelDev” com listagem de artigos, página de post individual, busca com filtro por tags, suporte a Markdown, highlight de código e imagens responsivas. Feito para rodar 100% no front-end, ideal para GitHub Pages.

- Demo: https://ismaelly1984.github.io/blogtech/
- Stack: HTML + CSS + JavaScript (Vanilla) + Marked + Prism.js + (DOMPurify no post)
- SEO: `robots.txt`, `sitemap.xml` (gerado por script), meta tags dinâmicas nos posts

## Recursos
- Listagem com busca e paginação (6 por página).
- Filtro por tag via querystring (`?tag=react`).
- Busca por título ou tag com `?search=<termo>` e debounce.
- Página de artigo com conteúdo em Markdown (Marked) e highlight (Prism.js).
- Sanitização de HTML no post com DOMPurify.
- Imagens responsivas com `<picture>` (WebP + JPG) e skeleton loader (CLS reduzido).
- Tema claro/escuro com `localStorage` e atalho no header.
- Meta tags e canonical dinâmicos no post; keywords dinâmicas na listagem.
- CSP por meta tag para segurança (atualize ao incluir novos CDNs).

## Estrutura
```
.
├─ index.html                # Lista de artigos
├─ blog-post.html            # Página de artigo individual
├─ articles.json             # Fonte de dados dos artigos
├─ js/
│  ├─ blog.js                # Listagem, busca, paginação, imagens
│  ├─ post.js                # Render do post, SEO dinâmico, relacionados
│  └─ script.js              # Navbar móvel + tema (light/dark)
├─ css/
│  ├─ blog-base.css          # Tokens de tema, navbar, footer, utilitários
│  ├─ blog.css               # Estilos da listagem
│  └─ article.css            # Estilos do post, relacionados e tipografia
├─ images/
│  └─ blog/                  # Capas responsivas em JPG/WebP
├─ robots.txt
├─ sitemap.xml
└─ generate-sitemap.js       # Script Node para gerar sitemap
```

## Rodando localmente
Como é um site estático, basta servir a pasta em um servidor local.

Opção rápida (Python):
- Python 3: `python3 -m http.server 8080`
- Acesse: http://localhost:8080

Opção Node (http-server):
- `npx http-server -p 8080`
- Acesse: http://localhost:8080

Observação: abrir direto via `file://` pode bloquear `fetch('./articles.json')` em alguns navegadores. Prefira um servidor local.

## Como adicionar/editar artigos
Os artigos ficam em `articles.json`. Cada item segue o formato:

```jsonc
{
  "id": 1,                      // número único (inteiro)
  "title": "O que são React Hooks?",
  "slug": "o-que-sao-react-hooks", // opcional (não usado nas rotas atuais)
  "excerpt": "Resumo curto do artigo...",
  "content": "# Título\n\nMarkdown do artigo...", // Markdown suportado
  "category": "React",
  "tags": ["React", "Hooks", "JavaScript"],
  "author": "Ismael Nunes",
  "date": "2025-01-15",       // ISO (YYYY-MM-DD)
  "readTime": "6 min",
  "status": "published",      // published | draft
  "featured": false,           // exibe selo “Destaque” na listagem
  "image": "images/blog/react-hooks", // base sem extensão
  "imageAlt": "Capa do artigo",       // opcional (alt da imagem)
  "coverW": 800,               // opcional (render do <img>)
  "coverH": 450,               // opcional (render do <img>)
  "imageAspect": "16/9",      // informativo
  "references": ["https://..."] // links opcionais exibidos ao final
}
```

Dicas importantes:
- `status`: apenas `published` aparece no site.
- `id`: não repita valores; use números sequenciais.
- `date`: usado para ordenar (mais recentes primeiro) e no sitemap.
- `tags`: habilitam filtro por `?tag` e geram keywords na listagem.

### Imagens responsivas
Informe somente o caminho base em `image` (sem extensão). Gere os arquivos:
- WebP: `-400.webp`, `-800.webp`
- JPG:  `-400.jpg`,  `-800.jpg`

Exemplo: se `image` é `images/blog/nodejs`, crie:
- `images/blog/nodejs-400.webp` e `images/blog/nodejs-800.webp`
- `images/blog/nodejs-400.jpg`  e `images/blog/nodejs-800.jpg`

A listagem e o post usam `<picture>` para escolher o melhor formato/tamanho.

## Funcionalidades principais (por arquivo)
- `js/blog.js`: busca + paginação, render de cards, atualização de `meta[name="keywords"]` conforme tags exibidas.
- `js/post.js`: busca artigo por `?id=`, converte Markdown (Marked), sanitiza (DOMPurify), faz highlight (Prism.js), injeta canonical e meta tags (OG/Twitter) e mostra “Artigos Relacionados” por categoria/tags com fallback recente.
- `js/script.js`: menu mobile acessível (hambúrguer) e alternância light/dark com persistência.
- `css/blog-base.css`: tokens de tema, navbar, footer, skeleton, estilos globais e Prism.js ajustado ao tema.

## SEO e Sitemap
- `robots.txt` e `sitemap.xml` já incluídos.
- Gere um novo sitemap após editar `articles.json` executando:
  - `node generate-sitemap.js`
- O script lê as datas de `articles.json` e gera URLs de `blog-post.html?id=<id>`.
- As páginas de post atualizam automaticamente meta description/OG/Twitter.

## Segurança (CSP)
As páginas definem uma Content Security Policy via `<meta http-equiv="Content-Security-Policy" ...>`. Se incluir novas bibliotecas/CDNs, ajuste a diretiva `script-src`, `style-src`, `img-src` ou `connect-src` conforme necessário.

## Deploy (GitHub Pages)
1. Faça push da branch principal com os arquivos na raiz do repositório.
2. Em Settings → Pages, aponte para a branch principal (root).  
3. Acesse: `https://<seu-usuario>.github.io/<seu-repo>/`.

Dica: atualize o `href` canônico em `index.html` se o repositório mudar de nome.

## Roadmap/Ideias futuras
- Geração estática de páginas por `slug` (em vez de `?id=`) opcional.
- Pré-render de HTML a partir do Markdown no build para SEO aprimorado.
- Pesquisa full-text com índice leve (ex.: Fuse.js) sem depender de rede.

## Autor
- Ismael Nunes — Desenvolvedor Full Stack
- LinkedIn: https://www.linkedin.com/in/ismaelnunes6094
- GitHub: https://github.com/Ismaelly1984

