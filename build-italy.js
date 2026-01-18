#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const italyDir = './italy';
const outputDir = './_site/italy';

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Read README config
const readmeContent = readFileSync(join(italyDir, 'README.md'), 'utf-8');
const readmeFrontmatterMatch = readmeContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
const readmeConfig = {};

if (readmeFrontmatterMatch) {
  readmeFrontmatterMatch[1].split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*"?(.+?)"?$/);
    if (match) readmeConfig[match[1]] = match[2].replace(/"/g, '');
  });
}

const pageTitle = readmeConfig.title || 'Italy';
const pageSubtitle = readmeConfig.subtitle || '';

// Read all markdown files from italy folder
const mdFiles = readdirSync(italyDir)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .sort();

// Extract article data
const articles = mdFiles.map(file => {
  const content = readFileSync(join(italyDir, file), 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) return null;

  const frontmatter = {};
  frontmatterMatch[1].split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });

  const body = frontmatterMatch[2];

  // Extract first image from content
  // Supports: ![alt](url), ![[wiki-style]], and markdown image syntax
  let imageUrl = null;
  const imageMatch = body.match(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/);
  if (imageMatch) {
    imageUrl = imageMatch[1] || imageMatch[2];
  }

  const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');

  return {
    title: frontmatter.title,
    date: frontmatter.date,
    slug: slug,
    url: `/italy/${slug}/`,
    image: imageUrl,
    content: body,
    tags: frontmatter.tags ? frontmatter.tags.split('\n').map(t => t.trim().replace(/^-\s*/, '')) : []
  };
}).filter(Boolean);

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | Mike Oxhard</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    main {
      max-width: 100%;
      padding: 0;
    }

    .italy-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }

    .italy-header {
      text-align: right;
      margin-bottom: 2.5rem;
      padding-right: 2rem;
    }

    .italy-header h1 {
      font-size: 2.5rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin: 0;
      text-transform: uppercase;
    }

    .italy-header p {
      font-size: 1rem;
      color: var(--text-muted);
      margin: 0.5rem 0 0 0;
    }

    .articles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .article-card {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-bottom: 0;
    }

    .article-image {
      width: 100%;
      object-fit: cover;
      border-radius: 6px;
      display: block;
      background-color: var(--bg-secondary);
      aspect-ratio: 4 / 3;
      margin-bottom: 0.8rem;
    }

    /* All square images */
    .article-card:nth-child(1) .article-image {
      aspect-ratio: 1 / 1;
    }

    .article-card:nth-child(2) .article-image {
      aspect-ratio: 1 / 1;
    }

    .article-card:nth-child(3) .article-image {
      aspect-ratio: 1 / 1;
    }

    .article-card:nth-child(n+4) .article-image {
      aspect-ratio: 1 / 1;
    }

    .article-meta {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .article-date {
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 500;
    }

    .article-category {
      border: 1.5px solid var(--text-muted);
      border-radius: 14px;
      padding: 0.1rem 0.4rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .article-title {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      line-height: 1.25;
      color: var(--text);
      margin: 0.15rem 0 0 0;
    }

    .article-card a {
      text-decoration: none;
      color: var(--text);
    }

    .article-card a:hover .article-title {
      color: var(--link);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .articles-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .articles-grid {
        grid-template-columns: repeat(1, 1fr);
        margin-left: 0;
        margin-right: auto;
      }

      .italy-header {
        text-align: center;
        padding-right: 0;
      }

      .italy-header h1 {
        font-size: 1.75rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="site-title">Mike Oxhard</a>
    </nav>
  </header>

  <main>
    <div class="italy-container">
      <div class="italy-header">
        <h1>${pageTitle}</h1>
        ${pageSubtitle ? `<p>${pageSubtitle}</p>` : ''}
      </div>

      <div class="articles-grid">
        ${articles.map((article, index) => `
        <article class="article-card">
          <a href="${article.url}">
            ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` : '<div class="article-image" style="display: flex; align-items: center; justify-content: center; color: var(--text-faint);">No image</div>'}
            <div class="article-meta">
              <span class="article-date">${new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase().replace(/ /g, ' ')}</span>
              ${article.tags.length > 0 ? `<span class="article-category">${article.tags[0].toUpperCase()}</span>` : ''}
            </div>
            <h2 class="article-title">${article.title}</h2>
          </a>
        </article>
        `).join('')}
      </div>
    </div>
  </main>

  <footer>
    <a href="https://github.com/mchlkucera">@mchlkucera</a>
  </footer>

  <script>
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('theme-dark');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (e.matches) {
        document.body.classList.add('theme-dark');
      } else {
        document.body.classList.remove('theme-dark');
      }
    });
  </script>
</body>
</html>`;

writeFileSync(join(outputDir, 'index.html'), html);
console.log('✓ Italy page generated');
