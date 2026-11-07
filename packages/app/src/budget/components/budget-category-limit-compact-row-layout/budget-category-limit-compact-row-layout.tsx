import { View } from 'react-native';

import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly leading: ReactNode;
    readonly amountInput: ReactNode;
}

export const BudgetCategoryLimitCompactRowLayout = ({ leading, amountInput }: Props) => {
    const isLargeText = useIsLargeTextSize();
    const rowClassName = isLargeText ? 'gap-y-xs' : 'flex-row items-center gap-x-md';
    const leadingClassName = isLargeText ? 'self-stretch' : 'flex-1';

    return (
        <View collapsable={false} className={cn('bg-surface-row-opaque px-3xl py-sm', rowClassName)}>
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <View className={leadingClassName}>{leading}</View>
            {amountInput}
        </View>
    );
};
