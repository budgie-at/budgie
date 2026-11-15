import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface YieldListPayoutItemInterface {
    readonly kind: YieldListItemKindEnum.PAYOUT;
    readonly id: string;
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly isUnassigned: boolean;
}
