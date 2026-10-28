import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

export const BudgetHistoryLegend = () => {
    const { t } = useLingui();

    const items = [
        { label: t`Under limit`, swatchClassName: 'h-2 w-2 rounded-xxs bg-positive-foreground' },
        { label: t`Over`, swatchClassName: 'h-2 w-2 rounded-xxs bg-destructive-foreground' },
        { label: t`Limit`, swatchClassName: 'h-0.5 w-4 rounded-full bg-primary' }
    ];

    return (
        <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            {items.map(item => (
                <View key={item.label} className="flex-row items-center gap-x-sm">
                    <View className={item.swatchClassName} />
                    <Text className="text-xxs text-secondary-foreground">{item.label}</Text>
                </View>
            ))}
        </View>
    );
};
