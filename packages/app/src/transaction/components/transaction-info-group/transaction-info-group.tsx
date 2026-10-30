import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const TransactionInfoGroup = ({ children }: Props) => (
    <View className="overflow-hidden rounded-3xl bg-surface-row" style={continuousCorners}>
        <View className="-mt-px">{children}</View>
    </View>
);
