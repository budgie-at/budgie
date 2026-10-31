import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { RecurringCalendarEntryRow } from '../recurring-calendar-entry-row/recurring-calendar-entry-row';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';
import type { ReactNode } from 'react';

interface Props {
    readonly title: ReactNode;
    readonly formattedTotal: string;
    readonly entries: readonly RecurringCalendarEntryInterface[];
    readonly displayMonth?: number;
    readonly displayYear?: number;
    readonly headerTestID?: string;
    readonly emptyContent?: ReactNode;
}

export const RecurringCalendarEntryList = ({
    title,
    formattedTotal,
    entries,
    displayMonth,
    displayYear,
    headerTestID,
    emptyContent
}: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const hasDayLabels = isDefined(displayMonth) && isDefined(displayYear);
    const rowsClassName = hasDayLabels ? 'pt-lg' : '';

    return (
        <View className="flex-1 pt-lg">
            <View className="bg-surface py-md -mx-5xl px-5xl flex-row justify-between items-center">
                <Text className="text-[13px] font-semibold text-primary" {...testIDProps(headerTestID)}>
                    {title}
                </Text>
                <ProtectedText className="text-[13px] tabular-nums text-secondary-foreground">{formattedTotal}</ProtectedText>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="pb-5xl" showsVerticalScrollIndicator={false}>
                {isNotEmptyArray(entries) ? (
                    <View className={rowsClassName}>
                        {entries.map((entry, index) => (
                            <RecurringCalendarEntryRow
                                key={entry.key}
                                entry={entry}
                                position={getTransactionListRowPosition(index, entries.length)}
                                {...(hasDayLabels && {
                                    dayLabel: formatMonthAndDay(new Date(displayYear, displayMonth, entry.dayOfMonth))
                                })}
                            />
                        ))}
                    </View>
                ) : (
                    emptyContent
                )}
                <MenuSpacer />
            </ScrollView>
        </View>
    );
};
