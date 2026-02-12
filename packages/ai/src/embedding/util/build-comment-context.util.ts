import { EMBEDDING_CONTEXT_MAX_LENGTH } from '../../@generic/constant/embedding.constant';

import { buildContextParts } from './build-context-parts.util';

interface BuildCommentContextParamsInterface {
    readonly comment: string;
    readonly categoryTitle?: string | null;
}

export const buildCommentContext = (params: BuildCommentContextParamsInterface): string => {
    const context = buildContextParts([
        { label: 'Transaction', value: params.comment },
        { label: 'Category', value: params.categoryTitle }
    ]);

    return context.length > EMBEDDING_CONTEXT_MAX_LENGTH ? context.slice(0, EMBEDDING_CONTEXT_MAX_LENGTH) : context;
};
