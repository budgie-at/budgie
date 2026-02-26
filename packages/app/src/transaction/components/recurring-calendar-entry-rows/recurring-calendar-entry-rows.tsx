import { View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getRecurringEntryKey } from '../../utils/get-recurring-entry-key.util';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
    readonly displayMonth: number;
    readonly displayYear: number;
}

export const RecurringCalendarEntryRows = ({ entries, displayMonth, displayYear }: Props) => {
    const { formatMonthAndDay } = useFormatDate();

    return (
        <View className="gap-y-lg pt-lg">
            {entries.map((entry, index) => {
                const dayLabel = formatMonthAndDay(new Date(displayYear, displayMonth, entry.dayOfMonth));
                const key = getRecurringEntryKey(entry);

                return <RecurringCalendarEntryRow key={key} entry={entry} index={index} dayLabel={dayLabel} />;
            })}
        </View>
    );
};
