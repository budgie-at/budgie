import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface RefundedPillPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID?: string;
}
