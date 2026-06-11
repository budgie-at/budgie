import type { TransactionInfoSimilarPeriodEnum } from '../enum/transaction-info-similar-period.enum';

export interface TransactionInfoSimilarPeriodButtonPropsInterface {
    readonly label: string;
    readonly period: TransactionInfoSimilarPeriodEnum;
    readonly selectedPeriod: TransactionInfoSimilarPeriodEnum;
    readonly onPeriodChange: (period: TransactionInfoSimilarPeriodEnum) => void;
}
