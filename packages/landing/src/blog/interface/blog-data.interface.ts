import { MDXContent } from 'mdx/types';
import { BlogArticleInterface } from './blog-article.interface';

export interface BlogDataInterface {
    default: MDXContent;
    metadata: BlogArticleInterface;
}
