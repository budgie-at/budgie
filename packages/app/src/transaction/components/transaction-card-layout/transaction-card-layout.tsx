import { View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { TransactionRowLayout } from '../transaction-row-layout/transaction-row-layout';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly title: ReactNode;
    readonly children: ReactNode;
    readonly amount: ReactNode;
}

export const TransactionCardLayout = ({ icon, title, children, amount }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    if (!isAccessibilityTextSize) {
        return (
            <TransactionRowLayout icon={icon} amount={amount}>
                {title}
                {children}
            </TransactionRowLayout>
        );
    }

    return (
        <View className="gap-y-xs">
            <View className="flex-row items-start gap-x-md">
                <View className="flex-1 min-w-0">{title}</View>
                {icon}
            </View>
            {children}
            <View className="flex-row">{amount}</View>
        </View>
    );
};
