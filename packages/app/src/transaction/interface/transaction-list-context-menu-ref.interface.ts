import type { PopoverMenuAnchor } from '../../@generic/component/popover-menu/popover-menu';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionListContextMenuRefInterface {
    readonly open: (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => void;
}
