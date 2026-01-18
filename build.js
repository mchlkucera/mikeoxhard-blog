const fs = require('fs');
const path = require('path');

// Read config
const configContent = fs.readFileSync('_config.yml', 'utf-8');
const config = {};
configContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      config[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
});

// Ensure _site directory
const siteDir = './_site';
if (!fs.existsSync(siteDir)) {
  fs.mkdirSync(siteDir, { recursive: true });
}

// Helper function to read and render layouts
function getLayout(layoutName) {
  let content = fs.readFileSync(`_layouts/${layoutName}.html`, 'utf-8');
  // Strip frontmatter if present
  content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  return content;
}

// Helper function to format date like Jekyll
function formatDate(dateStr, format) {
  const date = new Date(dateStr);
  if (format === '%B %-d, %Y') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return dateStr;
}

// Helper function to render liquid variables
function renderLiquid(content, data) {
  let result = content;

  // Replace site variables
  result = result.replace(/\{\{\s*site\.title\s*\}\}/g, config.title || 'Mike Oxhard');
  result = result.replace(/\{\{\s*site\.github_url\s*\}\}/g, config.github_url || 'https://github.com/mchlkucera');
  result = result.replace(/\{\{\s*site\.github_username\s*\}\}/g, config.github_username || 'mchlkucera');
  result = result.replace(/\{\{\s*site\.description\s*\}\}/g, config.description || '');

  // Replace page variables with filters
  result = result.replace(/\{\{\s*page\.date\s*\|\s*date:\s*"([^"]+)"\s*\}\}/g, (match, format) => {
    return data.date ? formatDate(data.date, format) : '';
  });

  result = result.replace(/\{\{\s*page\.date\s*\|\s*date_to_xmlschema\s*\}\}/g, () => {
    if (data.date) {
      const date = new Date(data.date);
      return date.toISOString();
    }
    return '';
  });

  // Replace page variables
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result = result.replace(new RegExp(`\\{\\{\\s*page\\.${key}\\s*\\}\\}`, 'g'), value);
    }
  });

  // Handle if page.title blocks
  if (data.title) {
    result = result.replace(/\{%\s*if\s+page\.title\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, '$1');
  } else {
    result = result.replace(/\{%\s*if\s+page\.title\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, '');
  }

  // Handle if page.date blocks
  if (data.date) {
    result = result.replace(/\{%\s*if\s+page\.date\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, '$1');
  } else {
    result = result.replace(/\{%\s*if\s+page\.date\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, '');
  }

  // Handle if page.description blocks
  if (data.description) {
    result = result.replace(/\{%\s*if\s+page\.description\s*%\}([\s\S]*?)\{%\s*else\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, '$1');
  } else {
    result = result.replace(/\{%\s*if\s+page\.description\s*%\}[\s\S]*?\{%\s*else\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, '$1');
  }

  // Replace common liquid filters/functions
  result = result.replace(/\{\{\s*['"]\/['"].*?\|\s*relative_url\s*\}\}/g, '/');
  result = result.replace(/\{\{\s*['"]\/assets\/[^']*['"].*?\}\}/g, (match) => {
    const assetMatch = match.match(/['"]([^'"]+)['"]/);
    return assetMatch ? assetMatch[1] : match;
  });

  // Remove unrendered conditionals
  result = result.replace(/\{%\s*if\s+page\.description\s*%\}.*?\{%\s*endif\s*%\}/g, '');

  return result;
}

// Build homepage
console.log('📄 Building homepage...');
const defaultLayout = getLayout('default');
let homeContent = `
<div class="home">
  <section class="categories-section">
    <h2>Categories</h2>
    <ul class="categories-list">
      <li><a href="/italy/">Itálie 2022</a></li>
    </ul>
  </section>

  <section class="articles-section">
    <h2>Articles</h2>
    <ul class="articles-list">
      <li>
        <a href="/default/life-is-meaningless.-unless-you're-a-cyanobacteria/">
          <span class="article-date">2026 · 01</span>
          <span class="article-title">Life is meaningless. Unless you're a cyanobacteria</span>
        </a>
      </li>
    </ul>
  </section>
</div>
`;

let homeHtml = defaultLayout.replace('{{ content }}', homeContent);
homeHtml = renderLiquid(homeHtml, { title: '' });

fs.writeFileSync(`${siteDir}/index.html`, homeHtml);
console.log('✅ Homepage built');

// Build Italy gallery
console.log('📄 Building Italy gallery...');
const italyDir = './italy';
const italyArticles = [];

const files = fs.readdirSync(italyDir).filter(f => f.endsWith('.md') && f !== 'index.md');

files.forEach(file => {
  const content = fs.readFileSync(path.join(italyDir, file), 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (match) {
    const frontmatter = {};
    match[1].split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) frontmatter[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });

    // Extract image from markdown content
    const afterFrontmatter = content.substring(match[0].length);
    const imageMatch = afterFrontmatter.match(/!\[.*?\]\((\.\.\/)?assets\/([^)]+)\)/);
    const image = imageMatch ? imageMatch[2] : null;

    italyArticles.push({
      title: frontmatter.title || file.replace('.md', ''),
      date: frontmatter.date,
      subtitle: frontmatter.subtitle,
      image: frontmatter.image || image,
      url: `/italy/${file.replace('.md', '').toLowerCase().replace(/\s+/g, '-')}/`,
      file: file
    });
  }
});

// Sort by date descending
italyArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate article cards
let cards = '';
italyArticles.forEach(article => {
  const dateObj = new Date(article.date);
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

  cards += `        <article class="article-card">
          <a href="${article.url}">
            ${article.image ? `<img src="/assets/${article.image}" alt="${article.title}" class="article-image">` : ''}
            <div class="article-meta">
              <span class="article-date">${dateStr}</span>
            </div>
            <h2 class="article-title">${article.title}</h2>
            ${article.subtitle ? `<p class="article-subtitle">${article.subtitle}</p>` : ''}
          </a>
        </article>
`;
});

const galleryLayout = getLayout('gallery');
let layoutContent = galleryLayout.replace(
  /\s*{% for article in site\.italy %}[\s\S]*?{% endfor %}\s*/,
  '\n    ' + cards
);

layoutContent = layoutContent.replace(/\{\{\s*page\.title\s*\}\}/g, 'Itálie 2022');
layoutContent = layoutContent.replace(/\{%\s*if\s+page\.subtitle\s*%\}(.*?)\{%\s*endif\s*%\}/g, '<p>Barmanování, Přežívání, Masírování</p>');

let galleryHtml = defaultLayout.replace('{{ content }}', layoutContent);
galleryHtml = renderLiquid(galleryHtml, { title: 'Itálie 2022' });

fs.mkdirSync(`${siteDir}/italy`, { recursive: true });
fs.writeFileSync(`${siteDir}/italy/index.html`, galleryHtml);
console.log('✅ Italy gallery built');

// Build Italy articles
console.log('📄 Building Italy articles...');
const postLayout = getLayout('post');

italyArticles.forEach(article => {
  const articlePath = path.join(italyDir, article.file);
  const articleContent = fs.readFileSync(articlePath, 'utf-8');

  // Extract content after frontmatter
  const match = articleContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/);
  let htmlContent = match ? match[1] : articleContent;

  // Simple markdown to HTML conversion for headers and images
  htmlContent = htmlContent
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/!\[(.*?)\]\((\.\.\/)?assets\/([^)]+)\)/g, '<img src="/assets/$3" alt="$1">')
    .replace(/!\[(.*?)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, (match) => match.startsWith('<') ? match : match)
    .split('\n\n')
    .map(p => p.trim().startsWith('<') ? p : `<p>${p}</p>`)
    .join('\n');

  // Extract first image for cover
  const firstImageMatch = htmlContent.match(/<img[^>]*>/);
  const coverImage = firstImageMatch ? firstImageMatch[0] : '';
  const contentWithoutCover = coverImage ? htmlContent.replace(firstImageMatch[0], '') : htmlContent;

  const backLink = '<a href="/italy/" class="italy-back-link">← Back to Italy</a>';

  let articleHtml = postLayout.replace('<div class="post-back-link">\n    <!-- Back link will be inserted here -->\n  </div>', `<div class="post-back-link">\n    ${backLink}\n  </div>`);
  articleHtml = articleHtml.replace('<div class="post-cover">\n    <!-- Cover image will be inserted here -->\n  </div>', `<div class="post-cover">\n    ${coverImage}\n  </div>`);
  articleHtml = articleHtml.replace('<div class="post-content">\n    <!-- Content without cover image -->\n  </div>', `<div class="post-content">\n    ${contentWithoutCover}\n  </div>`);
  articleHtml = defaultLayout.replace('{{ content }}', articleHtml);
  articleHtml = renderLiquid(articleHtml, { title: article.title, date: article.date });

  const urlPath = article.url.replace(/^\/italy\//, '').replace(/\/$/, '');
  fs.mkdirSync(`${siteDir}/italy/${urlPath}`, { recursive: true });
  fs.writeFileSync(`${siteDir}/italy/${urlPath}/index.html`, articleHtml);
});

console.log(`✅ Built ${italyArticles.length} Italy articles`);

// Build default article (cyanobacteria)
console.log('📄 Building default articles...');
// Read actual files from default directory
const defaultDir = './default';
const defaultFiles = fs.readdirSync(defaultDir).filter(f => f.endsWith('.md'));

defaultFiles.forEach(fileName => {
  const articleName = fileName.replace('.md', '').toLowerCase().replace(/\s+/g, '-').replace(/['']/g, '');
  const articlePath = path.join(defaultDir, fileName);
  if (fs.existsSync(articlePath)) {
    const articleContent = fs.readFileSync(articlePath, 'utf-8');
    const match = articleContent.match(/^---\n([\s\S]*?)\n---/);

    if (match) {
      const frontmatter = {};
      match[1].split('\n').forEach(line => {
        const m = line.match(/^(\w+):\s*(.+)$/);
        if (m) frontmatter[m[1]] = m[2].replace(/^["']|["']$/g, '');
      });

      const contentMatch = articleContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/);
      let htmlContent = contentMatch ? contentMatch[1] : articleContent;

      htmlContent = htmlContent
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        .replace(/!\[(.*?)\]\((\.\.\/)?assets\/([^)]+)\)/g, '<img src="/assets/$3" alt="$1">')
        .replace(/!\[(.*?)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        .split('\n\n')
        .map(p => p.trim() ? `<p>${p}</p>` : '')
        .join('\n');

      // Extract first image for cover
      const firstImageMatch = htmlContent.match(/<img[^>]*>/);
      const coverImage = firstImageMatch ? firstImageMatch[0] : '';
      const contentWithoutCover = coverImage ? htmlContent.replace(firstImageMatch[0], '') : htmlContent;

      let articleHtml = postLayout.replace('<div class="post-back-link">\n    <!-- Back link will be inserted here -->\n  </div>', '<div class="post-back-link"></div>');
      articleHtml = articleHtml.replace('<div class="post-cover">\n    <!-- Cover image will be inserted here -->\n  </div>', `<div class="post-cover">\n    ${coverImage}\n  </div>`);
      articleHtml = articleHtml.replace('<div class="post-content">\n    <!-- Content without cover image -->\n  </div>', `<div class="post-content">\n    ${contentWithoutCover}\n  </div>`);
      articleHtml = defaultLayout.replace('{{ content }}', articleHtml);
      articleHtml = renderLiquid(articleHtml, { title: frontmatter.title || articleName, date: frontmatter.date });

      fs.mkdirSync(`${siteDir}/default/${articleName}`, { recursive: true });
      fs.writeFileSync(`${siteDir}/default/${articleName}/index.html`, articleHtml);
    }
  }
});

console.log('✅ Default articles built');
console.log('\n🎉 Build complete!');
