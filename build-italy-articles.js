#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const italyDir = './italy';
const outputDir = './_site/italy';

// Read all markdown files from italy folder
const mdFiles = readdirSync(italyDir)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .sort();

// Process each article
mdFiles.forEach(file => {
  const content = readFileSync(join(italyDir, file), 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) return;

  const frontmatter = {};
  frontmatterMatch[1].split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });

  const body = frontmatterMatch[2];

  // Extract first image and remove it from body
  let imageUrl = null;
  let bodyWithoutImage = body;
  const imageMatch = body.match(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/);
  if (imageMatch) {
    imageUrl = imageMatch[1] || imageMatch[2];
    // Remove the image from body
    bodyWithoutImage = body.replace(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/, '').trim();
  }

  // Convert wikilinks to regular links
  bodyWithoutImage = bodyWithoutImage.replace(/\[\[(.+?)\]\]/g, '[$1](/notes/$1)');

  // Convert markdown to HTML (basic conversion)
  let htmlBody = bodyWithoutImage
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, (match) => '<ul>' + match + '</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/gm, (match) => match === '\n' ? '' : match);

  htmlBody = '<p>' + htmlBody + '</p>';

  const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
  const articleDir = join(outputDir, slug);

  if (!existsSync(articleDir)) {
    mkdirSync(articleDir, { recursive: true });
  }

  // Generate article HTML
  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title} | Mike Oxhard</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    .article-wrapper {
      max-width: 100%;
      padding: 0;
    }

    main {
      max-width: 60ch;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .article-header {
      margin-bottom: 2rem;
    }

    .article-header h1 {
      margin-top: 0;
    }

    .back-link {
      display: inline-block;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .back-link:hover {
      color: var(--link);
    }

    .article-featured-image {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      object-position: center;
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
    <a href="/italy/" class="back-link">← Back to Italy</a>

    <article class="article-wrapper">
      ${imageUrl ? `<img src="${imageUrl}" alt="${frontmatter.title}" class="article-featured-image">` : ''}

      <header class="article-header">
        <h1>${frontmatter.title}</h1>
        <div class="post-meta">
          <time datetime="${frontmatter.date}">
            ${new Date(frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </div>
      </header>

      <div class="post-content">
        ${htmlBody}
      </div>
    </article>
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

  writeFileSync(join(articleDir, 'index.html'), articleHtml);
  console.log(`✓ Article generated: /italy/${slug}/`);
});

console.log('✓ All Italy articles generated');
