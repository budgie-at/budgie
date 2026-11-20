import { Text, View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly date: Date;
}

export const YieldDateHeader = ({ date }: Props) => {
    const { formatDayAndMonthAndYear } = useFormatDate();

    return (
        <View className="px-3xl pt-xl pb-sm">
            <Text accessibilityRole="header" className="text-[13px] font-semibold text-secondary-foreground">
                {formatDayAndMonthAndYear(date)}
            </Text>
        </View>
    );
};
