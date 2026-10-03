import { View } from 'react-native';

import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ entries }: Props) => (
    <View className="gap-y-lg">
        {entries.map((entry, index) => (
            <RecurringCalendarEntryRow key={entry.key} entry={entry} index={index} />
        ))}
    </View>
);
