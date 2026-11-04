import { Text } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { CalendarWeek } from 'react-native-ui-datepicker';

interface Props {
    readonly weekday: CalendarWeek;
}

export const RecurringCalendarWeekday = ({ weekday }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const label = isAccessibilityTextSize ? weekday.name.min.slice(0, 1) : weekday.name.min;

    return (
        <Text
            accessibilityLabel={weekday.name.full}
            maxFontSizeMultiplier={1.3}
            className="text-[12px] font-semibold text-secondary-foreground uppercase"
        >
            {label}
        </Text>
    );
};
