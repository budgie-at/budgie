import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly children: ReactNode;
    readonly amount: ReactNode;
}

export const TransactionRowLayout = ({ icon, children, amount }: Props) => (
    <View className="min-h-11 flex-row items-center gap-x-xl">
        {icon}
        <View className="flex-1 min-w-0 min-h-[38px] justify-center gap-y-xxs mr-xs">{children}</View>
        {amount}
    </View>
);
