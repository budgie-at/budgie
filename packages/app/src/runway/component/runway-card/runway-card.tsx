import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly className?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };

export const RunwayCard = ({ children, className }: Props) => (
    <View className={cn('overflow-hidden rounded-3xl bg-grouped-surface-row', className)} style={CONTINUOUS_CORNERS}>
        {children}
    </View>
);
