import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

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
                const key = `${entry.categoryId}-${entry.accountId}-${entry.latestAmount}`;

                const rightContent = (
                    <View className="ml-auto">
                        <Text className="text-xs text-secondary-foreground">{dayLabel}</Text>
                    </View>
                );

                return <RecurringCalendarEntryRow key={key} entry={entry} index={index} right={rightContent} />;
            })}
        </View>
    );
};
