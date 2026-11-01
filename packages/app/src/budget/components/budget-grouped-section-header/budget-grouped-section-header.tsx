import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

export const BudgetGroupedSectionHeader = ({ label, trailing, testID }: Props) => (
    <View testID={testID} collapsable={false} className="min-h-[44px] flex-row items-center justify-between pl-3xl">
        <Text className="text-primary text-[15px] font-semibold" accessibilityRole="header">
            {label}
        </Text>
        {trailing}
    </View>
);
