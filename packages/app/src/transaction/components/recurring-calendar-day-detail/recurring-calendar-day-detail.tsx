import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getRecurringEntryKey } from '../../utils/get-recurring-entry-key.util';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ entries }: Props) => {
    const router = useRouter();

    return (
        <View className="gap-y-lg">
            {entries.map((entry, index) => {
                const handlePress = isDefined(entry.latestTransactionId)
                    ? () => {
                          router.push(`/transactions/${entry.latestTransactionId}/expense`);
                      }
                    : undefined; // eslint-disable-line no-undefined -- No navigation for forecasted entries

                const key = getRecurringEntryKey(entry);

                return <RecurringCalendarEntryRow key={key} entry={entry} index={index} onPress={handlePress} />;
            })}
        </View>
    );
};
