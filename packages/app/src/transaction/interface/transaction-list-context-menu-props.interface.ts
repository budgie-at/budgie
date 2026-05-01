import type { PopoverMenuAnchor } from '../../@generic/component/popover-menu/popover-menu';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

export interface TransactionListContextMenuPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface | null;
    readonly anchor?: PopoverMenuAnchor;
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete: EmptyFn;
}
