import type { TransactionCreateInputInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface InzhurBankPairingInterface {
    readonly stampInputs: readonly { readonly transactionId: number; readonly externalId: string }[];
    readonly incomeClaims: readonly {
        readonly transaction: TransactionWithEntriesEntityInterface;
        readonly externalId: string;
        readonly fallback: TransactionCreateInputInterface;
    }[];
    readonly placeholderInputs: readonly TransactionCreateInputInterface[];
    readonly paired: number;
    readonly unpaired: number;
    readonly unmatchedBankCount: number;
}
