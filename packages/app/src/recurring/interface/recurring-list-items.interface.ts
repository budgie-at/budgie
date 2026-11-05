import type { RecurringListItemType } from '../type/recurring-list-item.type';

export interface RecurringListItemsInterface {
    readonly items: readonly RecurringListItemType[];
    readonly headerIndices: number[];
}
