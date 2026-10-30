import { Text, View } from 'react-native';

import { useI18nContext } from '../../../i18n/context/i18n.context';

interface Props {
    readonly day: Date;
}

export const CategorizeInboxDayLabel = ({ day }: Props) => {
    const { intl } = useI18nContext();

    return (
        <View>
            <Text className="text-primary text-md font-semibold tabular-nums" numberOfLines={1}>
                {intl.formatDate(day, { day: 'numeric' })}
            </Text>
            <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                {intl.formatDate(day, { weekday: 'short' })}
            </Text>
        </View>
    );
};
