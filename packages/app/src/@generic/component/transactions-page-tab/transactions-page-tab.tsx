import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { TabConfigInterface } from '../../interface/tab-config.interface';
import type { TransactionsTabType } from '../../type/transactions-tab.type';

interface Props {
    readonly tab: TabConfigInterface<TransactionsTabType>;
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
}

const tabVariants = cva('pb-sm border-b-2', {
    variants: { isActive: { true: 'border-primary', false: 'border-transparent' } }
});

const titleVariants = cva('text-3xl font-medium', {
    variants: { isActive: { true: 'text-primary', false: 'text-secondary-foreground' } }
});

export const TransactionsPageTab = ({ tab, activeTab, onChangeTab }: Props) => {
    const isActive = activeTab === tab.key;
    const accessibilityState = { selected: isActive };
    const handlePress = () => void onChangeTab(tab.key);

    return (
        <HapticPressable
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            accessible
            className={tabVariants({ isActive })}
            hitSlop={8}
            onPress={handlePress}
            testID={tab.testID}
        >
            <Text className={titleVariants({ isActive })}>{tab.label}</Text>
        </HapticPressable>
    );
};
