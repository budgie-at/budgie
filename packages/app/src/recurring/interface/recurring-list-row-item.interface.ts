import type { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import type { RecurringListItemKindEnum } from '../enum/recurring-list-item-kind.enum';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export interface RecurringListRowItemInterface {
    readonly type: RecurringListItemKindEnum.ROW;
    readonly id: string;
    readonly series: RecurringSeriesListItemInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly isPossible: boolean;
}
