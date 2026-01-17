# Mike Oxhard's Blog

A minimal, Obsidian-compatible digital garden built with a custom Bun-based static site generator. Inspired by Steph Ango's approach to digital note-taking and publishing.

## Features

- **Obsidian Compatible**: Write notes in Obsidian with full wikilink support (`[[Link]]`)
- **Automatic Wikilink Conversion**: `[[Note Title]]` and `[[Note Title|Display Text]]` converted to HTML links
- **Flexoki Color Scheme**: Beautiful light/dark mode using Steph Ango's Flexoki colors
- **Minimal Design**: Clean, readable typography with generous whitespace
- **Fast Builds**: Custom Bun-based build script for instant site generation
- **Auto-Deploy**: Push to GitHub, automatically deployed via Vercel

## Tech Stack

- **Build Tool**: Bun
- **Deployment**: Vercel
- **Version Control**: Obsidian Git plugin → GitHub → Vercel auto-deploy
- **Styling**: Vanilla CSS with Flexoki color scheme

## Local Development

```bash
# Build the site
bun build.js

# Serve locally (requires Python 3)
cd _site && python3 -m http.server 4000
```

Visit http://localhost:4000

## Writing Notes

1. Create markdown files in the project root (e.g., `My Note.md`)
2. Add YAML frontmatter:

```yaml
---
layout: post
title: My Note Title
date: 2026-01-17
---
```

3. Write content using:
   - Wikilinks: `[[Other Note]]` or `[[Other Note|Custom Text]]`
   - Markdown: headings, lists, bold, italic
   - Horizontal rules: `---`

4. Obsidian Git auto-commits and pushes
5. Vercel auto-deploys to production

## Project Structure

```
.
├── build.js              # Custom static site generator
├── assets/
│   └── style.css         # Flexoki-based styling
├── _layouts/
│   ├── default.html      # Base template
│   └── post.html         # Post template
├── index.html            # Homepage template
├── 404.html              # Error page template
├── *.md                  # Your notes (Obsidian files)
└── _site/                # Generated static site (gitignored)
```

## Deployment

The site automatically deploys to Vercel when pushed to the main branch.

- **Production URL**: https://www.mikeoxhard.com
- **Vercel Project**: moxhard-website

## Design Philosophy

- File-over-app: Plain markdown files, no lock-in
- Minimal hierarchy: Notes in root directory
- Internal linking: Wikilinks for connections
- Clean typography: System fonts, generous spacing
- Obsidian-first workflow: Write in Obsidian, publish automatically

## Credits

- Color scheme: [Flexoki by Steph Ango](https://stephango.com/flexoki)
- Inspired by: [Steph Ango's vault approach](https://stephango.com/vault)
