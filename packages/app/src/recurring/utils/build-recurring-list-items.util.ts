import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { isSameMonth } from 'date-fns/isSameMonth';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { getTransactionListRowPosition } from '../../transaction/utils/get-transaction-list-row-position.util';
import { RECURRING_DUE_SOON_DAYS } from '../constant/recurring-due-soon-days.constant';
import { RecurringListItemKindEnum } from '../enum/recurring-list-item-kind.enum';
import { RecurringSectionEnum } from '../enum/recurring-section.enum';

import { isPossibleRecurringSeries } from './is-possible-recurring-series.util';

import type { RecurringListItemType } from '../type/recurring-list-item.type';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

const COLLAPSIBLE_SECTIONS: ReadonlySet<RecurringSectionEnum> = new Set([RecurringSectionEnum.POSSIBLE, RecurringSectionEnum.ENDED]);

const compareByNextDate = (left: RecurringSeriesListItemInterface, right: RecurringSeriesListItemInterface): number => {
    if (!isDefined(left.nextDate) || !isDefined(right.nextDate)) {
        return Number(!isDefined(left.nextDate)) - Number(!isDefined(right.nextDate));
    }

    return left.nextDate.getTime() - right.nextDate.getTime();
};

const resolveExpenseSection = (item: RecurringSeriesListItemInterface, now: Date): RecurringSectionEnum => {
    if (!isDefined(item.nextDate)) {
        return RecurringSectionEnum.LATER;
    }
    if (differenceInCalendarDays(item.nextDate, now) <= RECURRING_DUE_SOON_DAYS) {
        return RecurringSectionEnum.DUE_SOON;
    }

    return isSameMonth(item.nextDate, now) ? RecurringSectionEnum.THIS_MONTH : RecurringSectionEnum.LATER;
};

const compareByConfidence = (left: RecurringSeriesListItemInterface, right: RecurringSeriesListItemInterface): number =>
    right.confidence - left.confidence;

export const buildRecurringListItems = (
    series: readonly RecurringSeriesListItemInterface[],
    expandedSections: readonly RecurringSectionEnum[],
    now: Date
): RecurringListItemType[] => {
    const tracked = series.filter(item => item.isActive && !isPossibleRecurringSeries(item));
    const ended = series.filter(item => !item.isActive && !isPossibleRecurringSeries(item));
    const expenses = tracked.filter(item => item.kind === RecurringSeriesKindEnum.EXPENSE).sort(compareByNextDate);
    const sections = [
        ...[RecurringSectionEnum.DUE_SOON, RecurringSectionEnum.THIS_MONTH, RecurringSectionEnum.LATER].map(section => ({
            section,
            entries: expenses.filter(item => resolveExpenseSection(item, now) === section)
        })),
        {
            section: RecurringSectionEnum.INCOME,
            entries: tracked.filter(item => item.kind === RecurringSeriesKindEnum.INCOME).sort(compareByNextDate)
        },
        { section: RecurringSectionEnum.POSSIBLE, entries: series.filter(isPossibleRecurringSeries).sort(compareByConfidence) },
        { section: RecurringSectionEnum.ENDED, entries: ended.sort(compareByNextDate) }
    ];
    const items: RecurringListItemType[] = [];

    for (const { section, entries } of sections.filter(({ entries: sectionEntries }) => isNotEmptyArray(sectionEntries))) {
        const isCollapsed = COLLAPSIBLE_SECTIONS.has(section) && !expandedSections.includes(section);

        items.push({
            type: RecurringListItemKindEnum.HEADER,
            id: `header-${section}`,
            section,
            count: entries.length,
            isCollapsed
        });

        if (!isCollapsed) {
            items.push(
                ...entries.map((entry, index) => ({
                    type: RecurringListItemKindEnum.ROW as const,
                    id: `row-${entry.id}`,
                    series: entry,
                    position: getTransactionListRowPosition(index, entries.length),
                    isPossible: section === RecurringSectionEnum.POSSIBLE
                }))
            );
        }
    }

    return items;
};
