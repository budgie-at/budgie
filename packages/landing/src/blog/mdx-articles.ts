import fs from 'fs';
import path from 'path';

import { BlogArticleInterface } from './interface/blog-article.interface';

export interface BlogArticleWithContent extends BlogArticleInterface {
    content: string;
}

const articlesDirectory = path.join(process.cwd(), 'src', 'blog', 'content');
export const getAllArticleSlugs = (): string[] => {
    if (!fs.existsSync(articlesDirectory)) {
        return [];
    }

    return fs.readdirSync(articlesDirectory).filter(slug => {
        const slugPath = path.join(articlesDirectory, slug);

        return fs.statSync(slugPath).isDirectory();
    });
};

export const getArticleMetadata = (slug: string): BlogArticleInterface | null => {
    const metadataPath = path.join(articlesDirectory, slug, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf8');

    return JSON.parse(metadataContent) as BlogArticleInterface;
};

export const getArticleContent = (slug: string, locale: string): string | null => {
    const contentPath = path.join(articlesDirectory, slug, locale, 'content.mdx');

    if (!fs.existsSync(contentPath)) {
        const fallbackPath = path.join(articlesDirectory, slug, 'en', 'content.mdx');

        if (!fs.existsSync(fallbackPath)) {
            return null;
        }

        return fs.readFileSync(fallbackPath, 'utf8');
    }

    return fs.readFileSync(contentPath, 'utf8');
};

export const getArticleBySlug = (slug: string, locale: string = 'en'): BlogArticleWithContent | null => {
    const metadata = getArticleMetadata(slug);
    if (!metadata) {
        return null;
    }

    const content = getArticleContent(slug, locale);
    if (!content) {
        return null;
    }

    return { ...metadata, content };
};

export const getAllArticles = (): BlogArticleInterface[] => {
    const slugs = getAllArticleSlugs();

    return slugs
        .map(slug => getArticleMetadata(slug))
        .filter((article): article is BlogArticleInterface => article !== null)
        .sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime());
};

export const getRecentArticles = (limit = 3): BlogArticleInterface[] => getAllArticles().slice(0, limit);
