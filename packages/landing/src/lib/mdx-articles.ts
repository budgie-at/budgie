import fs from 'fs';
import path from 'path';

export interface BlogArticle {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    tags: string[];
    image?: string;
    seo: {
        keywords: string[];
        metaDescription: string;
    };
}

export interface BlogArticleWithContent extends BlogArticle {
    content: string;
}

const articlesDirectory = path.join(process.cwd(), 'content', 'articles');

/**
 * Get all article slugs from the articles directory
 */
export const getAllArticleSlugs = (): string[] => {
    if (!fs.existsSync(articlesDirectory)) {
        return [];
    }

    return fs.readdirSync(articlesDirectory).filter(slug => {
        const slugPath = path.join(articlesDirectory, slug);

        return fs.statSync(slugPath).isDirectory();
    });
};

/**
 * Get metadata for a specific article
 */
export const getArticleMetadata = (slug: string): BlogArticle | null => {
    const metadataPath = path.join(articlesDirectory, slug, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf8');

    return JSON.parse(metadataContent) as BlogArticle;
};

/**
 * Get article content for a specific locale
 */
export const getArticleContent = (slug: string, locale: string): string | null => {
    const contentPath = path.join(articlesDirectory, slug, locale, 'content.mdx');

    if (!fs.existsSync(contentPath)) {
        // Fallback to English if locale not found
        const fallbackPath = path.join(articlesDirectory, slug, 'en', 'content.mdx');

        if (!fs.existsSync(fallbackPath)) {
            return null;
        }

        return fs.readFileSync(fallbackPath, 'utf8');
    }

    return fs.readFileSync(contentPath, 'utf8');
};

/**
 * Get complete article with content for a specific locale
 */
export const getArticleBySlug = (slug: string, locale: string = 'en'): BlogArticleWithContent | null => {
    const metadata = getArticleMetadata(slug);

    if (!metadata) {
        return null;
    }

    const content = getArticleContent(slug, locale);

    if (!content) {
        return null;
    }

    return {
        ...metadata,
        content
    };
};

/**
 * Get all articles with their metadata (without content)
 */
export const getAllArticles = (): BlogArticle[] => {
    const slugs = getAllArticleSlugs();

    return slugs
        .map(slug => getArticleMetadata(slug))
        .filter((article): article is BlogArticle => article !== null)
        .sort((article1, article2) => 
            // Sort by date descending (newest first)
             new Date(article2.date).getTime() - new Date(article1.date).getTime()
        );
};

/**
 * Get recent articles (default: 3)
 */
export const getRecentArticles = (limit = 3): BlogArticle[] => getAllArticles().slice(0, limit);
