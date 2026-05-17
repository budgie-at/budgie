import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface UncategorizedTransactionCountInterface {
    readonly total: number;
    readonly income: number;
    readonly expense: number;
    readonly types: TransactionTypeEnum[];
}
