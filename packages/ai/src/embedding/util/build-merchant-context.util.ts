import { EMBEDDING_CONTEXT_MAX_LENGTH } from '../../@generic/constant/embedding.constant';

import { buildContextParts } from './build-context-parts.util';

interface BuildMerchantContextParamsInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly categoryTitle?: string | null;
}

export const buildMerchantContext = (params: BuildMerchantContextParamsInterface): string => {
    const context = buildContextParts([
        { label: 'Transaction', value: params.title },
        { label: 'Type', value: params.mccDescription },
        { label: 'Category', value: params.categoryTitle }
    ]);

    return context.length > EMBEDDING_CONTEXT_MAX_LENGTH ? context.slice(0, EMBEDDING_CONTEXT_MAX_LENGTH) : context;
};
