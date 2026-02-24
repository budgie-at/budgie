import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
    readonly totalAmount: string;
}

export const RecurringCalendarUpcoming = ({ entries, totalAmount }: Props) => {
    const { t } = useLingui();

    return (
        <View>
            <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
                <Text className="text-xs uppercase text-secondary-foreground">
                    <Trans>Upcoming</Trans>
                </Text>
                <ProtectedText className="text-xs text-secondary-foreground">{totalAmount}</ProtectedText>
            </View>

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
        </View>
    );
};
