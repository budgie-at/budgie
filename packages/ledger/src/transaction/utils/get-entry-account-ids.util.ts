import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const getEntryAccountIds = (inputs: readonly Pick<TransactionCreateInputInterface, 'entries'>[]): number[] => [
    ...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))
];
