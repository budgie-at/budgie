export interface BlogArticleInterface {
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
