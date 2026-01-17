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

// Copy assets
if (!existsSync(join(outputDir, 'assets'))) {
  mkdirSync(join(outputDir, 'assets'), { recursive: true });
}
writeFileSync(join(outputDir, 'assets/style.css'), readFileSync('assets/style.css'));

// Process markdown files
const mdFiles = readdirSync('.').filter(f => f.endsWith('.md'));
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
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
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

console.log('✅ Site built successfully!');
console.log(`📄 Generated ${pages.length} pages`);
console.log(`🌐 Output: ${outputDir}`);
