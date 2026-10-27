import type { TransactionUpdatedByEnum } from '../../transaction/enum/transaction-updated-by.enum';

export interface ReceiptMatchCandidateInterface {
    readonly transactionId: number;
    readonly entryId: number;
    readonly accountId: number;
    readonly categoryId: number | null;
    readonly title: string;
    readonly comment: string;
    readonly updatedBy: TransactionUpdatedByEnum | null;
    readonly operatedAt: Date;
    readonly isCardMatch: boolean;
}
