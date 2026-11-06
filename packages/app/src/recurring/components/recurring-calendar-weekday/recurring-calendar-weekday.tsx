import { Text, View } from 'react-native';

import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { RECURRING_CALENDAR_CELL_STYLE } from '../../constant/recurring-calendar-cell-style.constant';

interface Props {
    readonly date: Date;
}

export const RecurringCalendarWeekday = ({ date }: Props) => {
    const { languageTag } = useLocaleInfo();
    const fullLabel = new Intl.DateTimeFormat(languageTag, { weekday: 'long' }).format(date);
    const label = new Intl.DateTimeFormat(languageTag, { weekday: 'narrow' }).format(date);

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
