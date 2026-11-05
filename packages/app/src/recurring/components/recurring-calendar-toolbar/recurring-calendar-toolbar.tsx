import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';

interface Props {
    readonly monthLabel: string;
    readonly isCurrentMonthDisplayed: boolean;
    readonly onPreviousMonth: () => void;
    readonly onCurrentMonth: () => void;
    readonly onNextMonth: () => void;
}

export const RecurringCalendarToolbar = (props: Props) => {
    const { monthLabel, isCurrentMonthDisplayed, onPreviousMonth, onCurrentMonth, onNextMonth } = props;
    const { t } = useLingui();
    const nextMonthAccessibilityState = { disabled: isCurrentMonthDisplayed };
    const nextChevronClassName = isCurrentMonthDisplayed ? 'text-secondary-foreground opacity-0' : 'text-primary';

    return (
        <View className="flex-row items-center justify-between">
            <HapticPressable
                onPress={onPreviousMonth}
                accessibilityRole="button"
                accessibilityLabel={t`Previous month`}
                hitSlop={12}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
                testID={RecurringCalendarSelector.PreviousMonthButton}
            >
                <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={20} />
            </HapticPressable>
            <HapticPressable
                onPress={onCurrentMonth}
                className="min-h-[44px] flex-1 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={monthLabel}
                accessibilityHint={t`Today`}
                testID={RecurringCalendarSelector.MonthLabel}
            >
                <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={2}
                    className="text-primary text-[17px] font-semibold capitalize"
                >
                    {monthLabel}
                </Text>
            </HapticPressable>
            <HapticPressable
                onPress={onNextMonth}
                accessibilityRole="button"
                accessibilityLabel={t`Next month`}
                accessibilityState={nextMonthAccessibilityState}
                hitSlop={12}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
                disabled={isCurrentMonthDisplayed}
                testID={RecurringCalendarSelector.NextMonthButton}
            >
                <Icon icon={UserIconNameEnum.ChevronRight} className={nextChevronClassName} size={20} />
            </HapticPressable>
        </View>
    );
};
