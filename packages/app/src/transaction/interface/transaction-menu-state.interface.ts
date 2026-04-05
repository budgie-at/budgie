import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { PopoverMenuAnchor } from '../../@generic/component/popover-menu/popover-menu';

export interface TransactionMenuStateInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly anchor: PopoverMenuAnchor;
}
