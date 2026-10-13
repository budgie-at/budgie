import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

export const RunwayForecastLegend = () => (
    <View className="gap-y-xs">
        <View className="flex-row items-center gap-x-sm">
            <View className="h-0.5 w-4 rounded-full bg-primary" />
            <Text className="text-xxs text-secondary-foreground">
                <Trans>Most likely balance</Trans>
            </Text>
        </View>

        <View className="flex-row items-center gap-x-sm">
            <View className="h-3 w-4 rounded-sm border border-ghost-corner bg-ghost-background" />
            <Text className="text-xxs text-secondary-foreground">
                <Trans>Range across better and worse months</Trans>
            </Text>
        </View>
    </View>
);
