import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

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
    const hasTotal = isNotEmptyString(formattedTotal);
    const hasDayLabels = isDefined(displayMonth) && isDefined(displayYear);

    return (
        <View className="gap-y-md">
            <View className="gap-x-xl flex-row flex-wrap justify-between items-center">
                <Text
                    dynamicTypeRamp="footnote"
                    className="text-[13px] font-medium text-secondary-foreground"
                    {...testIDProps(headerTestID)}
                >
                    {title}
                </Text>
                {hasTotal ? (
                    <ProtectedText dynamicTypeRamp="footnote" className="text-[12px] tabular-nums text-secondary-foreground">
                        {formattedTotal}
                    </ProtectedText>
                ) : null}
            </View>

            <View>
                {isNotEmptyArray(entries)
                    ? entries.map((entry, index) => (
                          <RecurringCalendarEntryRow
                              key={entry.key}
                              entry={entry}
                              position={getTransactionListRowPosition(index, entries.length)}
                              {...(hasDayLabels && {
                                  dayLabel: formatMonthAndDay(new Date(displayYear, displayMonth, entry.dayOfMonth))
                              })}
                          />
                      ))
                    : emptyContent}
            </View>
        </View>
    );
};
