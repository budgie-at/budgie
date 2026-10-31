import { View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly children: ReactNode;
    readonly amount: ReactNode;
}

export const TransactionRowLayout = ({ icon, children, amount }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    if (isAccessibilityTextSize) {
        return (
            <View className="gap-y-sm">
                {icon}
                <View className="gap-y-xxs">{children}</View>
                <View className="flex-row">{amount}</View>
            </View>
        );
    }

    return (
        <View className="min-h-11 flex-row items-center gap-x-xl">
            {icon}
            <View className="flex-1 min-w-0 min-h-[38px] justify-center gap-y-xxs mr-xs">{children}</View>
            {amount}
        </View>
    );
};
