import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const stampForDeferredEmbedding = (inputs: TransactionCreateInputInterface[]): TransactionCreateInputInterface[] =>
    inputs.map(input => ({ ...input, needsEmbedding: input.needsEmbedding ?? true }));
