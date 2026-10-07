import { TransactionTypeEnum } from '@budgie/contracts';

export interface PostArchiveOwnCardTransferCandidateInterface {
    readonly transactionId: number;
    readonly healedType: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly archivedAccountId: number;
}
