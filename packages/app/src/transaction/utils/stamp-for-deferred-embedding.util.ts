import { TransactionCreateInputInterface } from '@budgie/contracts';

import { aiLog } from '../../ai/utils/ai-log.util';

interface StampForDeferredEmbeddingResultInterface {
    readonly stampedInputs: TransactionCreateInputInterface[];
    readonly externalSources: string[];
}

export const stampForDeferredEmbedding = (
    inputs: TransactionCreateInputInterface[],
    source: 'bulkCreate' | 'import'
): StampForDeferredEmbeddingResultInterface => {
    const stampedInputs = inputs.map(input => ({ ...input, needsEmbedding: input.needsEmbedding ?? true }));
    const markedForEmbedding = stampedInputs.filter(input => input.needsEmbedding).length;
    const externalSources = [...new Set(stampedInputs.map(input => input.externalSource ?? 'internal'))];
    aiLog('embed:defer:stamp', {
        source,
        total: stampedInputs.length,
        markedForEmbedding,
        skipped: stampedInputs.length - markedForEmbedding,
        externalSources
    });

    return { stampedInputs, externalSources };
};
