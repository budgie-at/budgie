import type { RecurringListItemKindEnum } from '../enum/recurring-list-item-kind.enum';
import type { RecurringSectionEnum } from '../enum/recurring-section.enum';

export interface RecurringListHeaderItemInterface {
    readonly type: RecurringListItemKindEnum.HEADER;
    readonly id: string;
    readonly section: RecurringSectionEnum;
    readonly count: number;
    readonly isCollapsed: boolean;
}
