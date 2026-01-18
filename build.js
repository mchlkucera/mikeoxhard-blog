#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Simple Jekyll-like static site generator
const outputDir = './_site';

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Read layouts
const defaultLayout = readFileSync('_layouts/default.html', 'utf-8');
const postLayout = readFileSync('_layouts/post.html', 'utf-8');
const galleryLayout = readFileSync('_layouts/gallery.html', 'utf-8');

// Copy assets
if (!existsSync(join(outputDir, 'assets'))) {
  mkdirSync(join(outputDir, 'assets'), { recursive: true });
}
writeFileSync(join(outputDir, 'assets/style.css'), readFileSync('assets/style.css'));

// Copy italy images
const italyImageDir = join(outputDir, 'italy');
if (existsSync('italy')) {
  const italyFiles = readdirSync('italy');
  italyFiles.forEach(file => {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
      if (!existsSync(italyImageDir)) {
        mkdirSync(italyImageDir, { recursive: true });
      }
      const source = join('italy', file);
      const dest = join(italyImageDir, file);
      writeFileSync(dest, readFileSync(source));
    }
  });
}

// Process markdown files (exclude README)
const mdFiles = readdirSync('.').filter(f => f.endsWith('.md') && f !== 'README.md');
const pages = [];

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (frontmatterMatch) {
    const frontmatter = {};
    frontmatterMatch[1].split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) frontmatter[match[1]] = match[2];
    });

    const body = frontmatterMatch[2];
    const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');

    pages.push({
      title: frontmatter.title,
      date: frontmatter.date,
      url: `/notes/${slug}/`,
      content: body,
      layout: frontmatter.layout || 'post'
    });
  }
}

// Build index page
const indexContent = readFileSync('index.html', 'utf-8');
const indexMatch = indexContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);

if (indexMatch) {
  let indexHtml = indexMatch[1];

  // Sort pages by date
  const sortedPages = pages.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build page list with YYYY · MM format
  let pageList = '';
  for (const page of sortedPages) {
    const date = new Date(page.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    pageList += `
      <li class="note-item">
        <div class="note-date">${year} · ${month}</div>
        <h2 class="note-title">
          <a href="${page.url}">${page.title}</a>
        </h2>
      </li>
    `;
  }

  // Remove Jekyll liquid syntax and replace with actual content
  indexHtml = indexHtml
    .replace(/\{%\s*assign\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*endif\s*%\}/g, '')
    .replace(/\{%\s*endfor\s*%\}/g, '')
    .replace(/<ul class="note-list">[\s\S]*?<\/ul>/, `<ul class="note-list">${pageList}</ul>`);

  const finalHtml = defaultLayout
    .replace('{{ content }}', indexHtml)
    .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
    .replace(/\{\{\s*['"]\/'['"]\s*\|\s*relative_url\s*\}\}/g, '/')
    .replace(/\{\{\s*['"]\/assets\/style\.css['"].*?\}\}/g, '/assets/style.css')
    .replace(/\{%\s*if\s+page\.title\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, "Mike Oxhard")
    .replace(/\{\{\s*'\/'\s*\|\s*relative_url\s*\}\}/g, '/'); // Fix header link

  writeFileSync(join(outputDir, 'index.html'), finalHtml);
}

// Build 404 page
if (existsSync('404.html')) {
  const notFoundContent = readFileSync('404.html', 'utf-8');
  const notFoundMatch = notFoundContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);

  if (notFoundMatch) {
    let notFoundHtml = notFoundMatch[1];

    // Remove Jekyll liquid syntax
    notFoundHtml = notFoundHtml
      .replace(/\{%\s*assign\s+[\s\S]*?%\}/g, '')
      .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
      .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
      .replace(/\{%\s*endif\s*%\}/g, '')
      .replace(/\{%\s*endfor\s*%\}/g, '');

    const finalHtml = defaultLayout
      .replace('{{ content }}', notFoundHtml)
      .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
      .replace(/\{\{\s*['"]\/'['"]\s*\|\s*relative_url\s*\}\}/g, '/')
      .replace(/\{\{\s*['"]\/assets\/style\.css['"].*?\}\}/g, '/assets/style.css')
      .replace(/\{%\s*if\s+page\.title\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, "404 - Page Not Found | Mike Oxhard")
      .replace(/\{\{\s*'\/'\s*\|\s*relative_url\s*\}\}/g, '/');

    writeFileSync(join(outputDir, '404.html'), finalHtml);
  }
}

// Build individual pages
for (const page of pages) {
  const slug = page.url.replace('/notes/', '').replace('/', '');
  const pageDir = join(outputDir, 'notes', slug);

  if (!existsSync(pageDir)) {
    mkdirSync(pageDir, { recursive: true });
  }

  // Convert markdown-like content to HTML (basic conversion)
  // Remove any H1s from content (title is already in header)
  let htmlContent = page.content
    .replace(/^# .+$/gm, '') // Remove H1s completely
    // Convert wikilinks to markdown links
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, target, display) => {
      const slug = target.trim().toLowerCase().replace(/\s+/g, '-');
      return `[${display.trim()}](/notes/${slug}/)`;
    })
    .replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
      const slug = title.trim().toLowerCase().replace(/\s+/g, '-');
      return `[${title.trim()}](/notes/${slug}/)`;
    })
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^---$/gm, '<hr>') // Convert --- to horizontal rule
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // Convert markdown links to HTML
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .trim();

  // Handle lists more carefully - process line by line
  const lines = htmlContent.split('\n');
  let inList = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^- (.+)$/)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push('<li>' + line.substring(2) + '</li>');
    } else {
      if (inList && line.trim() === '') {
        result.push('</ul>');
        inList = false;
      }
      if (line.trim() !== '' || !inList) {
        result.push(line);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  htmlContent = result.join('\n').replace(/\n\n+/g, '</p><p>');

  let pageHtml = postLayout
    .replace('{{ content }}', `<p>${htmlContent}</p>`)
    .replace(/\{\{\s*page\.title\s*\}\}/g, page.title)
    .replace(/\{\{\s*page\.date.*?\}\}/g, page.date ? new Date(page.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')
    .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*endif\s*%\}/g, '')
    .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*endfor\s*%\}/g, '')
    .replace(/---[\s\S]*?---/g, ''); // Remove any remaining frontmatter

  const finalHtml = defaultLayout
    .replace('{{ content }}', pageHtml)
    .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
    .replace(/\{%\s*if\s+page\.title\s*%\}.*?\{%\s*endif\s*%\}/g, `${page.title} | Mike Oxhard`)
    .replace(/\{\{\s*['"]\/'['"]\s*\|\s*relative_url\s*\}\}/g, '/')
    .replace(/\{\{\s*['"]\/assets\/style\.css['"].*?\}\}/g, '/assets/style.css')
    .replace(/\{\{\s*'\/'\s*\|\s*relative_url\s*\}\}/g, '/'); // Fix header link

  writeFileSync(join(pageDir, 'index.html'), finalHtml);
}

// Process Italy gallery directory
const italyIndexPath = 'italy/index.md';
if (existsSync(italyIndexPath)) {
  const italyReadmeContent = readFileSync(italyIndexPath, 'utf-8');
  const italyReadmeMatch = italyReadmeContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (italyReadmeMatch) {
    // Parse Italy config
    const italyConfig = {};
    italyReadmeMatch[1].split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*"?(.+?)"?$/);
      if (match) {
        italyConfig[match[1]] = match[2].replace(/"/g, '');
      }
    });

    if (italyConfig.type === 'directory') {
      const italyDir = 'italy';
      const italyOutputDir = join(outputDir, 'italy');

      // Create output directory
      if (!existsSync(italyOutputDir)) {
        mkdirSync(italyOutputDir, { recursive: true });
      }

      // Process Italy articles
      const italyFiles = readdirSync(italyDir)
        .filter(f => f.endsWith('.md') && f !== 'README.md')
        .sort();

      const italyArticles = [];

      for (const file of italyFiles) {
        const content = readFileSync(join(italyDir, file), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (!frontmatterMatch) continue;

        const frontmatter = {};
        frontmatterMatch[1].split('\n').forEach(line => {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) frontmatter[match[1]] = match[2];
        });

        const body = frontmatterMatch[2];

        // Extract first image
        let imageUrl = null;
        let bodyWithoutImage = body;
        const imageMatch = body.match(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/);
        if (imageMatch) {
          const rawImagePath = imageMatch[1] || imageMatch[2];
          // Resolve image path relative to italy folder
          imageUrl = /^(https?:|\/|data:)/.test(rawImagePath) ? rawImagePath : `/italy/${rawImagePath}`;
          bodyWithoutImage = body.replace(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/, '').trim();
        }

        const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');

        // Generate placeholder image if not found
        const placeholderColors = ['#B7B5AC', '#4A90E2', '#E8D4A8', '#24837B', '#A97C4F', '#6F6E69'];
        const imageColor = placeholderColors[italyArticles.length % placeholderColors.length];

        const finalImageUrl = imageUrl || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='${encodeURIComponent(imageColor)}' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23FFFCF0' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(frontmatter.title || 'Article')}%3C/text%3E%3C/svg%3E`;

        italyArticles.push({
          title: frontmatter.title,
          date: frontmatter.date,
          slug: slug,
          image: finalImageUrl,
          content: bodyWithoutImage,
          tags: frontmatter.tags ? (frontmatter.tags.match(/\w+/g) || []) : []
        });

        // Create individual article page
        const articleDir = join(italyOutputDir, slug);
        if (!existsSync(articleDir)) {
          mkdirSync(articleDir, { recursive: true });
        }

        // Convert markdown to HTML
        let htmlContent = bodyWithoutImage
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .trim();

        htmlContent = htmlContent.replace(/(<li>.*<\/li>)/s, (match) => '<ul>' + match + '</ul>');
        htmlContent = htmlContent.replace(/\n\n+/g, '</p><p>');

        const featuredImageHtml = imageUrl ? `<img src="${imageUrl}" alt="${frontmatter.title}" class="article-featured-image">` : '';

        // Create article wrapper with featured image and back link
        const backLinkHtml = '<div style="max-width: 60ch; margin: 0 auto; padding: 2rem 1rem 0;"><a href="/italy/" style="display: inline-block; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; margin-bottom: 1.5rem;">← Back to Italy</a></div>';
        const featuredImageWrapper = imageUrl ? `<img src="${imageUrl}" alt="${frontmatter.title}" style="width: 100%; max-width: 900px; margin: 2rem auto; display: block; border-radius: 8px; padding: 0 1rem; box-sizing: border-box;">` : '';

        let articleHtml = postLayout
          .replace(/^---\n[\s\S]*?\n---\n/, '') // Remove frontmatter
          .replace(/\{\{\s*page\.title\s*\}\}/g, frontmatter.title)
          .replace(/\{\{\s*page\.date.*?\}\}/g, frontmatter.date ? new Date(frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')
          .replace('{{ content }}', `${backLinkHtml}${featuredImageWrapper}<p>${htmlContent}</p>`)
          .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
          .replace(/\{%\s*endif\s*%\}/g, '')
          .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
          .replace(/\{%\s*endfor\s*%\}/g, '')
          .replace(/---[\s\S]*?---/g, '');

        const finalArticleHtml = defaultLayout
          .replace('{{ content }}', articleHtml)
          .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
          .replace(/\{%\s*if\s+page\.title\s*%\}.*?\{%\s*endif\s*%\}/g, `${frontmatter.title} | Mike Oxhard`)
          .replace(/\{\{\s*['"]\/'['"]\s*\|\s*relative_url\s*\}\}/g, '/')
          .replace(/\{\{\s*['"]\/assets\/style\.css['"].*?\}\}/g, '/assets/style.css')
          .replace(/\{\{\s*'\/'\s*\|\s*relative_url\s*\}\}/g, '/');

        writeFileSync(join(articleDir, 'index.html'), finalArticleHtml);
      }

      // Generate gallery index
      let galleryArticleCards = '';
      for (const article of italyArticles) {
        const dateObj = new Date(article.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
        const category = article.tags[0] ? article.tags[0].toUpperCase() : 'ARTICLE';

        galleryArticleCards += `
        <article class="article-card">
          <a href="/italy/${article.slug}/">
            <img src="${article.image}" alt="${article.title}" class="article-image">
            <div class="article-meta">
              <span class="article-date">${dateStr}</span>
              <span class="article-category">${category}</span>
            </div>
            <h2 class="article-title">${article.title}</h2>
          </a>
        </article>
        `;
      }

      let galleryHtml = galleryLayout
        .replace(/^---\n[\s\S]*?\n---\n/, '') // Remove frontmatter
        .replace(/\{\{\s*page\.title\s*\}\}/g, italyConfig.title)
        .replace(/\{\{\s*page\.subtitle\s*\}\}/g, italyConfig.subtitle || '')
        .replace('{{ content }}', galleryArticleCards)
        .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
        .replace(/\{%\s*endif\s*%\}/g, '')
        .replace(/\{%\s*endfor\s*%\}/g, '');

      const finalGalleryHtml = defaultLayout
        .replace('{{ content }}', galleryHtml)
        .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
        .replace(/\{%\s*if\s+page\.title\s*%\}.*?\{%\s*endif\s*%\}/g, `${italyConfig.title} | Mike Oxhard`)
        .replace(/\{\{\s*['"]\/'['"]\s*\|\s*relative_url\s*\}\}/g, '/')
        .replace(/\{\{\s*['"]\/assets\/style\.css['"].*?\}\}/g, '/assets/style.css')
        .replace(/\{\{\s*'\/'\s*\|\s*relative_url\s*\}\}/g, '/');

      writeFileSync(join(italyOutputDir, 'index.html'), finalGalleryHtml);
    }
  }
}

console.log('✅ Site built successfully!');
console.log(`📄 Generated ${pages.length} pages`);
console.log(`🌐 Output: ${outputDir}`);
