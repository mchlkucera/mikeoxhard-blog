# Italy Blog Setup

## Overview
Created a complete Italy blog gallery system that pulls data from the `italy/` folder and renders it as a beautiful masonry gallery with linked article pages.

## How It Works

### 1. Data Source
- **Config**: `italy/README.md` - Contains page title and subtitle
- **Articles**: `italy/*.md` - Each markdown file becomes an article
  - `My First Note.md`
  - `The Evolution of Tractors.md`

### 2. Image Extraction
- First image in each article is automatically extracted
- Supports both formats: `![[wiki-style]]` and `![alt](url)`
- Used as the card thumbnail in the gallery

### 3. Build Scripts
- `build-italy.js` - Generates `/italy/index.html` gallery page
- `build-italy-articles.js` - Generates individual article pages

## Generated Structure

```
_site/italy/
├── index.html                      (Gallery page)
├── my-first-note/
│   └── index.html                  (Article page)
└── the-evolution-of-tractors/
    └── index.html                  (Article page)
```

## Features

### Gallery Page (`/italy/`)
- ✓ Title and subtitle from README.md config
- ✓ 3-column masonry layout with varied aspect ratios
- ✓ Tight spacing between cards (1.8rem margin-bottom)
- ✓ Small category badges extracted from article tags
- ✓ Date formatting (JAN 26, 2026)
- ✓ Clickable links to articles
- ✓ Responsive: 2 columns on tablet, 1 column on mobile

### Article Pages (`/italy/{slug}/`)
- ✓ Featured image prominently displayed
- ✓ Image max-width: 900px (wider than text content)
- ✓ Image centered horizontally with 3rem top/bottom margin
- ✓ Text content: standard 60ch max-width
- ✓ Back link to gallery page
- ✓ Date formatting
- ✓ Dark mode support

## Configuration

### README.md Template
```yaml
---
title: "Italy: Travel & Culture"
subtitle: "Exploring the beauty, history, and culture of Italy"
layout: post
---

A collection of thoughts, stories, and insights from travels and experiences in Italy.
```

Edit the `title` and `subtitle` to change the gallery page header.

## Adding New Articles

1. Create a new markdown file in `italy/` folder
2. Add frontmatter with title, date, and tags
3. Include an image on the first line: `![[image.png]]` or `![alt](url)`
4. Run build scripts:
   ```bash
   bun build-italy.js
   bun build-italy-articles.js
   ```

## URLs

- **Gallery**: `http://localhost:8000/italy/`
- **Article 1**: `http://localhost:8000/italy/my-first-note/`
- **Article 2**: `http://localhost:8000/italy/the-evolution-of-tractors/`

## Styling

All styling uses the Flexoki color scheme and follows the site's design system. The gallery and articles inherit the dark mode support automatically.
