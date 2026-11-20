import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface YieldPayoutFoldInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly tax: TransactionWithRelationsEntityInterface | null;
}
