import { Text, View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RECURRING_CALENDAR_CELL_STYLE } from '../../constant/recurring-calendar-cell-style.constant';

interface Props {
    readonly date: Date;
}

export const RecurringCalendarWeekday = ({ date }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const { languageTag } = useLocaleInfo();
    const fullLabel = new Intl.DateTimeFormat(languageTag, { weekday: 'long' }).format(date);
    const shortLabel = new Intl.DateTimeFormat(languageTag, { weekday: 'short' }).format(date).slice(0, 2);
    const label = isAccessibilityTextSize ? shortLabel.slice(0, 1) : shortLabel;

    return (
        <View className="h-[25px] items-center justify-center" style={RECURRING_CALENDAR_CELL_STYLE}>
            <Text
                accessibilityLabel={fullLabel}
                maxFontSizeMultiplier={1.3}
                className="text-[12px] font-semibold text-secondary-foreground uppercase"
            >
                {label}
            </Text>
        </View>
    );
};
