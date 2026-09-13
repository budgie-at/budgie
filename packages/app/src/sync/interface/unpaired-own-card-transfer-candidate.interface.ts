import { TransactionTypeEnum } from '@budgie/contracts';

export interface UnpairedOwnCardTransferCandidateInterface {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly counterpartAccountId: number;
}
