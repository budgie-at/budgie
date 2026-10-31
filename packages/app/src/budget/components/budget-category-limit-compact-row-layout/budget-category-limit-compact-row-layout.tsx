import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly leading: ReactNode;
    readonly amountInput: ReactNode;
}

export const BudgetCategoryLimitCompactRowLayout = ({ leading, amountInput }: Props) => (
    <View collapsable={false} className="flex-row items-center gap-x-md bg-surface-row-opaque px-3xl py-sm">
        <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
        <View className="flex-1">{leading}</View>
        {amountInput}
    </View>
);
