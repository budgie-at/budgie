import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

const titleVariants = cva('text-3xl font-medium', {
    variants: {
        isActive: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const AnalyticsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const isStatisticsActive = activeTab === 'statistics';
    const isRecurringActive = activeTab === 'recurring';

    const handleStatisticsPress = () => {
        onChangeTab('statistics');
    };

    const handleRecurringPress = () => {
        onChangeTab('recurring');
    };

    return (
        <View className="px-5xl pb-md">
            <View className="flex-row items-center gap-x-xl">
                <HapticPressable onPress={handleStatisticsPress}>
                    <Text className={titleVariants({ isActive: isStatisticsActive })}>
                        <Trans>Statistics</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable onPress={handleRecurringPress}>
                    <Text className={titleVariants({ isActive: isRecurringActive })}>
                        <Trans>Recurring</Trans>
                    </Text>
                </HapticPressable>
            </View>
        </View>
    );
};
