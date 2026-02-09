# Notion Image Migration Guide

This guide explains how to replace Notion-hosted images with local assets in blog posts.

## Problem

Markdown files imported from Notion contain image links like:
```markdown
![Alt text](https://prod-files-secure.s3.us-west-2.amazonaws.com/...)
```

These URLs are:
- Temporary (they expire)
- Require authentication
- Not reliable for production use

## Solution

Replace Notion URLs with local assets stored in the `assets/` directory.

## Process

### 1. Load Notion MCP Tools

```bash
# The Notion tools should already be configured in your Claude Code setup
# Use ToolSearch to load them if needed
```

### 2. Fetch the Notion Page

Use the Notion API to fetch the page content and get authenticated image URLs:

```typescript
// Using Claude Code's Notion MCP integration
mcp__notion__notion-fetch({
  id: "https://www.notion.so/your-page-url-here"
})
```

This returns the page content with full image URLs including authentication tokens.

### 3. Download Images

Use curl to download images from the authenticated URLs:

```bash
curl -L "https://prod-files-secure.s3.us-west-2.amazonaws.com/[FULL_URL_WITH_TOKENS]" \
  -o assets/descriptive-filename.jpg
```

**Naming Convention:**
- Use format: `{article-id}-{description}.{ext}`
- Example: `19-30-colosseum-building.jpg`
- Keep filenames descriptive but concise

### 4. Update Markdown Files

Replace the Notion URL with a relative path to the local asset:

**Before:**
```markdown
![Alt text](https://prod-files-secure.s3.us-west-2.amazonaws.com/...)
```

**After:**
```markdown
![Alt text](../assets/descriptive-filename.jpg)
```

### 5. Verify the Image

```bash
# Check file size (should be reasonable, not tiny)
ls -lh assets/descriptive-filename.jpg

# Verify it's a valid image
file assets/descriptive-filename.jpg
```

## Complete Example

```bash
# 1. Fetch page from Notion (get authenticated URLs)
# (Use Claude Code Notion MCP integration)

# 2. Download image
curl -L "https://prod-files-secure.s3.us-west-2.amazonaws.com/2e2d5d81-8fa9-4b93-989a-d5ba3a4ef7d3/ff0029f2-435b-47ca-aa94-3f6550f82a8b/IMG20220901111016.jpg?[AUTH_PARAMS]" \
  -o assets/19-30-colosseum-building.jpg

# 3. Verify download
ls -lh assets/19-30-colosseum-building.jpg
# Should show reasonable size (e.g., 1.2M)

# 4. Update markdown file
# Replace:
# ![Description](https://prod-files-secure.s3.us-west-2.amazonaws.com/...)
# With:
# ![Description](../assets/19-30-colosseum-building.jpg)

# 5. Commit changes
git add assets/19-30-colosseum-building.jpg "italy/19-30: Article.md"
git commit -m "fix: replace Notion image URL with local asset for article 19-30"
git push
```

## Tips

- **Download all images at once** when migrating a full article
- **Check file sizes** - a tiny file (< 1KB) likely means the download failed
- **Use descriptive names** that match the content
- **Commit images with their markdown updates** in the same commit
- **Test locally** before pushing to verify images display correctly

## Troubleshooting

### Image shows as broken/corrupt (very small file size)
The authentication tokens in the URL may have expired. Re-fetch the page from Notion to get fresh URLs.

### URL has expired
Notion URLs with authentication tokens expire. Always fetch fresh URLs from the Notion API before downloading.

### Image doesn't display on site
- Check the relative path is correct (`../assets/` from article directory)
- Verify the file exists in the assets directory
- Ensure the filename matches exactly (case-sensitive)

## Automation Ideas

For bulk migrations, consider:
- Script to fetch all pages from Notion
- Extract all image URLs
- Download and rename systematically
- Update all markdown files in one pass

## Related Files

- `/assets/` - Local image storage
- `/italy/*.md` - Blog post markdown files
- `/.gitignore` - Ensure large images are tracked appropriately
