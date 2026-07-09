import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

export interface TransactionListContextMenuContextValueInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly closeMenu: (afterClose?: EmptyFn) => void;
}
