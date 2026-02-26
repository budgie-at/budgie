import { buildContextParts } from './build-context-parts.util';
import { truncateContext } from './truncate-context.util';

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

    return truncateContext(context);
};
