import type { SimilarTransactionMonthRowInterface } from './similar-transaction-month-row.interface';

export interface SimilarTransactionStatsInterface {
    readonly count: number;
    readonly totalAmount: number;
    readonly averageAmount: number;
    readonly currencySymbol: string;
    readonly months: readonly SimilarTransactionMonthRowInterface[];
}
