import { TransactionEntityInterface } from '@budgie/contracts';

export interface VoiceReviewCreateResultInterface {
    readonly transactions: TransactionEntityInterface[];
    readonly destinationAccountId: number;
}
