import { View } from 'react-native';

import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getRecurringEntryKey } from '../../utils/get-recurring-entry-key.util';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ entries }: Props) => (
    <View className="gap-y-lg">
        {entries.map((entry, index) => {
            const key = getRecurringEntryKey(entry);

            return <RecurringCalendarEntryRow key={key} entry={entry} index={index} />;
        })}
    </View>
);
