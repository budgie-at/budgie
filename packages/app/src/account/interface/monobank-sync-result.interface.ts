import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export interface MonobankSyncResultInterface {
    readonly success: boolean;
    readonly accounts: AccountEntityInterface[];
    readonly transactions: TransactionEntityInterface[];
    readonly error?: string;
}
