# Blog Articles Structure

This directory contains all blog articles for the Budgie landing page using MDX format with localization support.

## Directory Structure

```
content/articles/
└── [article-slug]/
    ├── metadata.json          # Article metadata (title, author, tags, SEO, etc.)
    ├── en/
    │   └── content.mdx       # English content
    ├── uk/
    │   └── content.mdx       # Ukrainian content
    ├── fr/
    │   └── content.mdx       # French content
    ├── de/
    │   └── content.mdx       # German content
    └── es/
        └── content.mdx       # Spanish content
```

## Adding a New Article

### 1. Create the Article Directory

Create a new directory with your article slug:

```bash
mkdir -p content/articles/my-new-article/{en,uk,fr,de,es}
```

### 2. Create `metadata.json`

Create a `metadata.json` file in the article directory:

```json
{
  "slug": "my-new-article",
  "title": "My New Article Title",
  "description": "A brief description of the article",
  "date": "2025-11-06",
  "author": "Author Name",
  "tags": ["tag1", "tag2", "tag3"],
  "image": "/images/my-article-image.jpg",
  "seo": {
    "keywords": [
      "keyword1",
      "keyword2",
      "keyword3"
    ],
    "metaDescription": "SEO-optimized meta description for search engines"
  }
}
```

### 3. Create Localized MDX Content

Create `content.mdx` files for each supported locale:

**`en/content.mdx`:**
```mdx
# My New Article Title

Your article content here in **Markdown** format.

## Section Heading

- List item 1
- List item 2

[Link to something](#)
```

Repeat for each locale (`uk`, `fr`, `de`, `es`).

## MDX Features

The content files support standard Markdown syntax:

- **Bold** and *italic* text
- # Headings (H1-H6)
- Lists (ordered and unordered)
- [Links](https://example.com)
- Code blocks
- Images
- Blockquotes
- Horizontal rules

## Accessing Articles in Code

Use the utilities from `src/lib/mdx-articles.ts`:

```typescript
import { getAllArticles, getArticleBySlug } from '@/lib/mdx-articles';

// Get all articles
const articles = getAllArticles();

// Get a specific article with content for a locale
const article = getArticleBySlug('my-article-slug', 'en');
```

## Supported Locales

- `en` - English
- `uk` - Ukrainian
- `fr` - French
- `de` - German
- `es` - Spanish

## Best Practices

1. **Keep metadata consistent** across all locales
2. **Translate all content** - don't leave placeholder content in any locale
3. **Use descriptive slugs** - URL-friendly, lowercase, hyphen-separated
4. **Optimize images** - compress images before adding them
5. **Add SEO keywords** - include relevant keywords for search optimization
6. **Write clear descriptions** - helps with social sharing and search results
7. **Use proper markdown** - follow Markdown best practices for readability

## File Naming Conventions

- Article slugs: `lowercase-with-hyphens`
- Metadata file: Always named `metadata.json`
- Content files: Always named `content.mdx`
- Locale directories: Two-letter ISO 639-1 codes (`en`, `uk`, `fr`, `de`, `es`)
