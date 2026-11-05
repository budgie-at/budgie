import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RECURRING_CALENDAR_CELL_STYLE } from '../../constant/recurring-calendar-cell-style.constant';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarDayDots } from '../recurring-calendar-day-dots/recurring-calendar-day-dots';

import type { RecurringCalendarDayInterface } from '../../interface/recurring-calendar-day.interface';
import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const MAX_DOTS = 3;

const circleVariants = cva('items-center justify-center rounded-full', {
    variants: {
        isSelected: { true: 'bg-primary', false: '' },
        isToday: { true: '', false: '' },
        hasEntries: { true: '', false: '' },
        isAccessibilityTextSize: { true: 'w-[44px] h-[44px]', false: 'w-[36px] h-[36px]' }
    },
    compoundVariants: [
        { isToday: true, isSelected: false, className: 'border border-primary' },
        { hasEntries: true, isSelected: false, className: 'bg-primary/6 dark:bg-primary/18' }
    ]
});

const textVariants = cva('text-[15px] leading-[20px] tabular-nums pb-[8px]', {
    variants: {
        isCurrentMonth: { true: 'text-primary', false: 'text-secondary-foreground' },
        isSelected: { true: 'text-primary-reverse font-semibold', false: '' },
        isToday: { true: 'font-semibold', false: '' },
        hasEntries: { true: 'font-semibold', false: '' }
    }
});

interface Props {
    readonly day: RecurringCalendarDayInterface;
    readonly onSelectDay: (day: number) => void;
    readonly isLoading: boolean;
    readonly entriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly RecurringCalendarEntryInterface[]>;
}

export const RecurringCalendarDay = (props: Props) => {
    const { day, onSelectDay, isLoading, entriesByDay, forecastedEntriesByDay } = props;
    const { t } = useLingui();
    const { languageTag } = useLocaleInfo();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const { number: dayOfMonth, isSelected, isCurrentMonth, isToday } = day;
    const entryCount = (isCurrentMonth ? entriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const forecastedCount = (isCurrentMonth ? forecastedEntriesByDay.get(dayOfMonth)?.length : 0) ?? 0;
    const hasEntries = entryCount + forecastedCount > 0;
    const actualDots = Math.min(entryCount, isPositiveNumber(forecastedCount) ? MAX_DOTS - 1 : MAX_DOTS);
    const dayTestID = isCurrentMonth ? RecurringCalendarSelector.CurrentMonthDay(dayOfMonth) : null;

    const formattedDate = new Intl.DateTimeFormat(languageTag, { dateStyle: 'full' }).format(day.date);
    const accessibilityLabel = isLoading ? formattedDate : t`${formattedDate}. Recorded: ${entryCount}. Expected: ${forecastedCount}.`;
    const accessibilityState = { selected: isSelected, disabled: day.isDisabled, busy: isLoading };
    const handlePress = () => {
        onSelectDay(dayOfMonth);
    };

    return (
        <HapticPressable
            className="min-h-[44px] items-center justify-center"
            style={RECURRING_CALENDAR_CELL_STYLE}
            hitSlop={0}
            onPress={handlePress}
            disabled={day.isDisabled}
            accessible={isCurrentMonth}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            {...testIDProps(dayTestID)}
        >
            <View className={circleVariants({ isSelected, isToday, hasEntries, isAccessibilityTextSize })}>
                <Text maxFontSizeMultiplier={1.5} className={cn(textVariants({ isCurrentMonth, isSelected, isToday, hasEntries }))}>
                    {dayOfMonth}
                </Text>
                {hasEntries ? (
                    <RecurringCalendarDayDots
                        actualDots={actualDots}
                        forecastedDots={Math.min(forecastedCount, MAX_DOTS - actualDots)}
                        isSelected={isSelected}
                    />
                ) : null}
            </View>
        </HapticPressable>
    );
};
