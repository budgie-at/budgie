import { buildContextParts } from './build-context-parts.util';

export const buildMerchantContext = (title: string, mccDescription: string): string =>
    buildContextParts([
        { label: 'Transaction', value: title },
        { label: 'Type', value: mccDescription }
    ]);
