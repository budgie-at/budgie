import type { TransactionInfoSimilarPeriodEnum } from '../enum/transaction-info-similar-period.enum';
import type { SimilarTransactionStatsInterface } from '@budgie/contracts';

export interface TransactionInfoSimilarCardPropsInterface {
    readonly stats: SimilarTransactionStatsInterface | null;
    readonly period: TransactionInfoSimilarPeriodEnum;
    readonly title: string;
    readonly isLoading: boolean;
    readonly onPeriodChange: (period: TransactionInfoSimilarPeriodEnum) => void;
}
