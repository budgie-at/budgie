import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { CalendarDay as DatePickerCalendarDay } from 'react-native-ui-datepicker';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarDayDots } from '../recurring-calendar-day-dots/recurring-calendar-day-dots';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const MAX_DOTS = 3;

const circleVariants = cva('items-center justify-center rounded-full', {
    variants: {
        isSelected: { true: 'bg-primary', false: '' },
        isToday: { true: '', false: '' },
        hasEntries: { true: '', false: '' },
        isAccessibilityTextSize: { true: 'w-[44px] h-[44px]', false: 'w-[40px] h-[40px]' }
    },
    compoundVariants: [
        { isToday: true, isSelected: false, className: 'border border-primary' },
        { hasEntries: true, isSelected: false, className: 'bg-primary/6 dark:bg-primary/18' }
    ]
});

const textVariants = cva('text-[15px] tabular-nums pb-[4px]', {
    variants: {
        isCurrentMonth: { true: 'text-primary', false: 'text-secondary-foreground' },
        isSelected: { true: 'text-primary-reverse font-semibold', false: '' },
        isToday: { true: 'font-semibold', false: '' },
        hasEntries: { true: 'font-semibold', false: '' }
    }
});

interface Props {
    readonly day: DatePickerCalendarDay;
    readonly isLoading: boolean;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
}

export const RecurringCalendarDay = ({ day, isLoading, entriesByDay, forecastedEntriesByDay }: Props) => {
    const { t } = useLingui();
    const { languageTag } = useLocaleInfo();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const dayOfMonth = day.number;
    const { isSelected, isCurrentMonth, isToday } = day;
    const entryCount = (isCurrentMonth ? entriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const forecastedCount = (isCurrentMonth ? forecastedEntriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const hasEntries = entryCount + forecastedCount > 0;
    const actualDots = Math.min(entryCount, MAX_DOTS);
    const forecastedDots = Math.min(forecastedCount, MAX_DOTS - actualDots);
    const dayTestID = isCurrentMonth ? RecurringCalendarSelector.CurrentMonthDay(dayOfMonth) : null;

    const formattedDate = new Intl.DateTimeFormat(languageTag, { dateStyle: 'full' }).format(new Date(day.date));
    const accessibilityLabel = isLoading ? formattedDate : t`${formattedDate}. Recorded: ${entryCount}. Expected: ${forecastedCount}.`;
    const accessibilityState = { selected: isSelected, disabled: day.isDisabled, busy: isLoading };

    return (
        <View className="items-center">
            <View
                className={circleVariants({ isSelected, isToday, hasEntries, isAccessibilityTextSize })}
                accessible={isDefined(dayTestID)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={accessibilityState}
                {...testIDProps(dayTestID)}
            >
                <Text maxFontSizeMultiplier={1.5} className={cn(textVariants({ isCurrentMonth, isSelected, isToday, hasEntries }))}>
                    {day.text}
                </Text>
                {hasEntries ? (
                    <RecurringCalendarDayDots actualDots={actualDots} forecastedDots={forecastedDots} isSelected={isSelected} />
                ) : null}
            </View>
        </View>
    );
};
