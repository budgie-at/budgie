import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface ImportedUpdateParamInterface {
    readonly transactionId: number;
    readonly input: TransactionCreateInputInterface;
}
