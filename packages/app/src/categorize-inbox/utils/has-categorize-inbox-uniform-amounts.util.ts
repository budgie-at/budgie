import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export const hasCategorizeInboxUniformAmounts = (
    rows: readonly Pick<CategorizeInboxRowInterface, 'amount' | 'instrumentSymbol'>[]
): boolean => new Set(rows.map(row => `${row.instrumentSymbol}:${row.amount}`)).size <= 1;
