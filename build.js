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

// Copy assets
const assetsDir = join(outputDir, 'assets');
if (existsSync('assets')) {
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }
  const attachmentFiles = readdirSync('assets');
  attachmentFiles.forEach(file => {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
      const source = join('assets', file);
      const dest = join(assetsDir, file);
      writeFileSync(dest, readFileSync(source));
    }
  });
}

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
const defaultPages = [];

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
    const title = file.replace('.md', ''); // Always use filename as title

    pages.push({
      title: title,
      date: frontmatter.date,
      url: `/notes/${slug}/`,
      content: body,
      layout: frontmatter.layout || 'post'
    });
  }
}

// Process markdown files from default directory
if (existsSync('default')) {
  const defaultDir = 'default';
  const defaultFiles = readdirSync(defaultDir).filter(f => f.endsWith('.md'));

  for (const file of defaultFiles) {
    const content = readFileSync(join(defaultDir, file), 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (frontmatterMatch) {
      const frontmatter = {};
      frontmatterMatch[1].split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) frontmatter[match[1]] = match[2];
      });

      const body = frontmatterMatch[2];
      const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
      const title = file.replace('.md', ''); // Use filename as title

      defaultPages.push({
        title: title,
        date: frontmatter.date,
        url: `/default/${slug}/`,
        content: body,
        layout: frontmatter.layout || 'post',
        originalFile: file
      });
    }
  }
}

// Copy files from default directory to output
const defaultOutputDir = join(outputDir, 'default');
if (existsSync('default') && !existsSync(defaultOutputDir)) {
  mkdirSync(defaultOutputDir, { recursive: true });
}
if (existsSync('default')) {
  const defaultFiles = readdirSync('default');
  defaultFiles.forEach(file => {
    if (/\.(png|jpg|jpeg|gif|webp|svg|md)$/i.test(file)) {
      const source = join('default', file);
      const dest = join(defaultOutputDir, file);
      writeFileSync(dest, readFileSync(source));
    }
  });
}

// Build index page
const indexContent = readFileSync('index.html', 'utf-8');
const indexMatch = indexContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);

if (indexMatch) {
  let indexHtml = indexMatch[1];

  // Sort pages by date
  const sortedPages = pages.sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedDefaultPages = defaultPages.sort((a, b) => new Date(b.date) - new Date(a.date));

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

  // Build default pages section with header
  let defaultPagesList = '';
  if (sortedDefaultPages.length > 0) {
    defaultPagesList = '<h3 class="section-header">Italy</h3>';
    for (const page of sortedDefaultPages) {
      const date = new Date(page.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      defaultPagesList += `
      <li class="note-item">
        <div class="note-date">${year} · ${month}</div>
        <h2 class="note-title">
          <a href="${page.url}">${page.title}</a>
        </h2>
      </li>
    `;
    }
  }

  // Combine both lists
  const combinedPageList = pageList + defaultPagesList;

  // Remove Jekyll liquid syntax and replace with actual content
  indexHtml = indexHtml
    .replace(/\{%\s*assign\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
    .replace(/\{%\s*endif\s*%\}/g, '')
    .replace(/\{%\s*endfor\s*%\}/g, '')
    .replace(/<ul class="note-list">[\s\S]*?<\/ul>/, `<ul class="note-list">${combinedPageList}</ul>`);

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
  buildPage(page, pageDir, slug);
}

// Build individual default pages
for (const page of defaultPages) {
  const slug = page.url.replace('/default/', '').replace('/', '');
  const pageDir = join(outputDir, 'default', slug);
  buildPage(page, pageDir, slug);
}

function buildPage(page, pageDir, slug) {

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
    // Convert markdown images to HTML (must be before regular links)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
      // Handle image paths: prepend /assets/ for bare filenames
      let imagePath = path;
      if (path.startsWith('/')) {
        imagePath = `/assets${path}`;
      } else if (!path.startsWith('./') && !path.startsWith('../')) {
        imagePath = `/assets/${path}`;
      }
      return `<img src="${imagePath}" alt="${alt}">`;
    })
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
const italyIndexPath = 'italy/INDEX.md';
if (existsSync(italyIndexPath)) {
  const italyIndexContent = readFileSync(italyIndexPath, 'utf-8');
  const italyIndexMatch = italyIndexContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (italyIndexMatch) {
    // Parse Italy config and articles from frontmatter
    const italyConfig = {};
    const articlesYAML = [];
    let inArticles = false;
    let currentArticle = {};

    italyIndexMatch[1].split('\n').forEach(line => {
      if (line.trim().startsWith('articles:')) {
        inArticles = true;
        return;
      }

      if (inArticles) {
        if (line.startsWith('  - ')) {
          if (Object.keys(currentArticle).length > 0) {
            articlesYAML.push(currentArticle);
          }
          currentArticle = {};
          const match = line.match(/- (\w+):\s*(.+)$/);
          if (match) {
            const value = match[2].replace(/^["']|["']$/g, '');
            currentArticle[match[1]] = value === 'null' ? null : value;
          }
        } else if (line.startsWith('    ') && line.trim()) {
          const match = line.match(/(\w+):\s*(.+)$/);
          if (match) {
            const value = match[2].replace(/^["']|["']$/g, '');
            currentArticle[match[1]] = value === 'null' ? null : value;
          }
        }
      } else {
        const match = line.match(/^(\w+):\s*"?(.+?)"?$/);
        if (match) {
          italyConfig[match[1]] = match[2].replace(/"/g, '');
        }
      }
    });

    if (Object.keys(currentArticle).length > 0) {
      articlesYAML.push(currentArticle);
    }

    if (italyConfig.layout === 'gallery') {
      const italyDir = 'italy';
      const italyOutputDir = join(outputDir, 'italy');

      // Create output directory
      if (!existsSync(italyOutputDir)) {
        mkdirSync(italyOutputDir, { recursive: true });
      }

      const italyArticles = [];

      // Process articles from INDEX.md
      for (const articleMeta of articlesYAML) {
        // Generate slug from title
        const slug = articleMeta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Try to find the article file by matching title in frontmatter
        let articleFile = null;
        const italyFiles = readdirSync(italyDir);

        for (const file of italyFiles) {
          if (file.toLowerCase() === 'index.md' || file.toLowerCase().endsWith('.md') === false) continue;
          // Match article by filename (without .md extension)
          if (file.replace('.md', '') === articleMeta.title) {
            articleFile = file;
            break;
          }
        }

        if (!articleFile) {
          console.warn(`Article file not found for: ${articleMeta.title}`);
          continue;
        }

        const content = readFileSync(join(italyDir, articleFile), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (!frontmatterMatch) continue;

        const body = frontmatterMatch[2];

        // Remove all images from body
        let bodyWithoutImage = body.replace(/!\[\[(.+?)\]\]|!\[.*?\]\((.+?)\)/g, '').trim();

        // Check if image exists (from INDEX.md)
        let imageUrl = null;
        if (articleMeta.image) {
          const imagePath = join('assets', articleMeta.image);
          if (existsSync(imagePath)) {
            imageUrl = `/assets/${articleMeta.image}`;
          }
        }

        const article = {
          title: articleMeta.title,
          date: articleMeta.date,
          subtitle: articleMeta.subtitle || '',
          slug: slug,
          image: imageUrl,
          content: bodyWithoutImage
        };

        italyArticles.push(article);

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
          // Convert markdown images to HTML (must be before regular links)
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
            // If path starts with /, prepend assets/
            const imagePath = path.startsWith('/') ? `/assets${path}` : path;
            return `<img src="${imagePath}" alt="${alt}">`;
          })
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .trim();

        htmlContent = htmlContent.replace(/(<li>.*<\/li>)/s, (match) => '<ul>' + match + '</ul>');
        htmlContent = htmlContent.replace(/\n\n+/g, '</p><p>');

        // Create article wrapper with featured image and back link
        const backLinkHtml = '<a href="/italy/" class="italy-back-link">← Back to Italy</a>';
        const featuredImageWrapper = article.image ? `<img src="${article.image}" alt="${article.title}" class="italy-featured-image">` : '';

        let articleHtml = postLayout
          .replace(/^---\n[\s\S]*?\n---\n/, '') // Remove frontmatter
          .replace(/\{\{\s*page\.title\s*\}\}/g, article.title)
          .replace(/\{\{\s*page\.date.*?\}\}/g, article.date ? new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')
          .replace('<article class="post">', `${backLinkHtml}<article class="post">`)
          .replace('{{ content }}', `${featuredImageWrapper}<p>${htmlContent}</p>`)
          .replace(/\{%\s*if\s+[\s\S]*?%\}/g, '')
          .replace(/\{%\s*endif\s*%\}/g, '')
          .replace(/\{%\s*for\s+[\s\S]*?%\}/g, '')
          .replace(/\{%\s*endfor\s*%\}/g, '')
          .replace(/---[\s\S]*?---/g, '');

        const finalArticleHtml = defaultLayout
          .replace('{{ content }}', articleHtml)
          .replace(/\{\{\s*site\.title\s*\}\}/g, "Mike Oxhard")
          .replace(/\{%\s*if\s+page\.title\s*%\}.*?\{%\s*endif\s*%\}/g, `${article.title} | Mike Oxhard`)
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
        const showDate = italyConfig.showDates !== 'false' && italyConfig.showDates !== false;

        galleryArticleCards += `
        <article class="article-card">
          <a href="/italy/${article.slug}/">
            ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` : ''}
            ${showDate ? `<div class="article-meta"><span class="article-date">${dateStr}</span></div>` : ''}
            <h2 class="article-title">${article.title}</h2>
            ${article.subtitle ? `<p class="article-subtitle">${article.subtitle}</p>` : ''}
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
