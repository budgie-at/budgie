import fs from 'fs';
import path from 'path';

import { isDefined } from '@rnw-community/shared';

import { BlogArticleInterface } from '../interface/blog-article.interface';
import { BlogDataInterface } from '../interface/blog-data.interface';

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

const getArticleMetadata = async (slug: string, locale: string): Promise<BlogArticleInterface | null> => {
    try {
        const data = (await import(`../content/${slug}/content.${locale}.mdx`)) as BlogDataInterface;

        return data.metadata;
    } catch {
        if (locale !== 'en') {
            try {
                const data = (await import(`../content/${slug}/content.en.mdx`)) as BlogDataInterface;

                return data.metadata;
            } catch {
                return null;
            }
        }

        return null;
    }
};

export const getArticles = async (locale: string): Promise<BlogArticleInterface[]> => {
    const slugs = getAllArticleSlugs();
    const articles = await Promise.all(slugs.map(slug => getArticleMetadata(slug, locale)));

    return articles.filter(isDefined).sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime());
};
