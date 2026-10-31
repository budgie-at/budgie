import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxOptionCard = ({ children }: Props) => (
    <View className="overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
        <View className="-mt-px">{children}</View>
    </View>
);
