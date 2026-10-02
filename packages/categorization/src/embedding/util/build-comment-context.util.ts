import { buildContextParts } from './build-context-parts.util';

export const buildCommentContext = (comment: string, categoryTitle: string | null): string =>
    buildContextParts([
        { label: 'Transaction', value: comment },
        { label: 'Category', value: categoryTitle }
    ]);
