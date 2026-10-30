import { isSameDay } from 'date-fns';

import type { CategorizeInboxDayGroupInterface } from '../interface/categorize-inbox-day-group.interface';
import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export const groupCategorizeInboxRowsByDay = (rows: readonly CategorizeInboxRowInterface[]): CategorizeInboxDayGroupInterface[] => {
    const groups: CategorizeInboxDayGroupInterface[] = [];

    for (const row of rows) {
        const lastGroup = groups.at(-1);

        if (lastGroup && isSameDay(lastGroup.day, row.operatedAt)) {
            lastGroup.rows.push(row);
        } else {
            groups.push({ day: row.operatedAt, rows: [row] });
        }
    }

    return groups;
};
