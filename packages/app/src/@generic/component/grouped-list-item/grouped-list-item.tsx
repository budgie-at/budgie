import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly children: ReactNode;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const GroupedListItem = ({ isFirst, isLast, children }: Props) => (
    <View
        className={cn('overflow-hidden bg-surface-row', isFirst && 'rounded-t-3xl', isLast && 'rounded-b-3xl')}
        style={CONTINUOUS_CORNERS}
    >
        <View className={cn(isFirst && '-mt-px')}>{children}</View>
    </View>
);
