import type { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import type { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface YieldListPayoutItemInterface {
    readonly kind: YieldListItemKindEnum.PAYOUT;
    readonly id: string;
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly tax: TransactionWithRelationsEntityInterface | null;
    readonly siblings: readonly TransactionWithRelationsEntityInterface[];
    readonly isUnassigned: boolean;
    readonly dateFormat: YieldPayoutDateFormatEnum;
    readonly position: TransactionListRowPositionEnum;
}
