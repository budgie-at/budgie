import { buildContextParts } from './build-context-parts.util';
import { truncateContext } from './truncate-context.util';

interface BuildCommentContextParamsInterface {
    readonly comment: string;
    readonly categoryTitle?: string | null;
}

export const buildCommentContext = (params: BuildCommentContextParamsInterface): string => {
    const context = buildContextParts([
        { label: 'Transaction', value: params.comment },
        { label: 'Category', value: params.categoryTitle }
    ]);

    return truncateContext(context);
};
