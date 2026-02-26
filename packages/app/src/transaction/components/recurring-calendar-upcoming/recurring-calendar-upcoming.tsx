import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarUpcoming = ({ entries }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-lg pt-lg">
            {entries.map((entry, index) => {
                const day = entry.dayOfMonth;
                const dayLabel = t`Day ${day}`;
                const key = `${entry.categoryId}-${entry.accountId}-${entry.latestAmount}-${entry.isForecast ? 'f' : 'a'}`;

                return <RecurringCalendarEntryRow key={key} entry={entry} index={index} dayLabel={dayLabel} />;
            })}
        </View>
    );
};
