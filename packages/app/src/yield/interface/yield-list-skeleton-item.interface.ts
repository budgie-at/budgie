import type { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListSkeletonItemInterface {
    readonly kind: YieldListItemKindEnum.SKELETON;
    readonly id: string;
    readonly position: TransactionListRowPositionEnum;
}
