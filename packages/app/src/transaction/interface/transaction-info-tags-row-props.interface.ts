import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionInfoTagsRowPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly label: string;
    readonly testID: string;
    readonly withBottomBorder?: boolean;
}
