import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionInfoCategoryRowsPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string | null;
    readonly hasFollowingRows: boolean;
}
