import fs from 'fs';
import path from 'path';

import { BlogArticleInterface } from '../interface/blog-article.interface';

const articlesDirectory = path.join(process.cwd(), 'src', 'blog', 'content');
const getAllArticleSlugs = (): string[] => {
    if (!fs.existsSync(articlesDirectory)) {
        return [];
    }

    return fs.readdirSync(articlesDirectory).filter(slug => {
        const slugPath = path.join(articlesDirectory, slug);

        return fs.statSync(slugPath).isDirectory();
    });
};

const getArticleMetadata = (slug: string): BlogArticleInterface | null => {
    const metadataPath = path.join(articlesDirectory, slug, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf8');

    return JSON.parse(metadataContent) as BlogArticleInterface;
};

export const getArticles = (): BlogArticleInterface[] => {
    const slugs = getAllArticleSlugs();

    return slugs
        .map(slug => getArticleMetadata(slug))
        .filter((article): article is BlogArticleInterface => article !== null)
        .sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime());
};
