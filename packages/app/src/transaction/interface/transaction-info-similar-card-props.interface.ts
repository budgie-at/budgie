import type { SimilarTransactionStatsInterface } from '@budgie/contracts';

export interface TransactionInfoSimilarCardPropsInterface {
    readonly stats: SimilarTransactionStatsInterface | null;
    readonly title: string;
    readonly isLoading: boolean;
}
