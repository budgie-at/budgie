import { isNotEmptyString } from '@rnw-community/shared';

import { buildContextParts } from './build-context-parts.util';
import { truncateContext } from './truncate-context.util';

interface BuildTransactionContextParamsInterface {
    readonly title: string;
    readonly mccDescription: string | null;
    readonly comment: string;
    readonly categoryTitle?: string | null;
    readonly tagTitles?: string | null;
}

export const buildTransactionContext = (params: BuildTransactionContextParamsInterface): string => {
    const hasTitle = isNotEmptyString(params.title);
    const commentLabel = hasTitle ? 'Note' : 'Transaction';

    const context = buildContextParts([
        { label: 'Transaction', value: params.title },
        { label: 'Type', value: params.mccDescription },
        { label: commentLabel, value: params.comment },
        { label: 'Category', value: params.categoryTitle },
        { label: 'Tags', value: params.tagTitles }
    ]);

    return truncateContext(context);
};
