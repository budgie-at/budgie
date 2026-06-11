import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionInfoAccountRowsPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly hasFollowingRows: boolean;
}
