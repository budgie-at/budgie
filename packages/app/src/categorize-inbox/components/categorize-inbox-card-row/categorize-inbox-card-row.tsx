import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly position: TransactionListRowPositionEnum;
    readonly children: ReactNode;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const CategorizeInboxCardRow = ({ position, children }: Props) => {
    const isTop = position === TransactionListRowPositionEnum.FIRST || position === TransactionListRowPositionEnum.SINGLE;
    const isBottom = position === TransactionListRowPositionEnum.LAST || position === TransactionListRowPositionEnum.SINGLE;

    return (
        <View className={cn('bg-surface-row', isTop && 'rounded-t-3xl', isBottom && 'mb-xl rounded-b-3xl')} style={continuousCorners}>
            {isTop ? null : <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />}
            {children}
        </View>
    );
};
