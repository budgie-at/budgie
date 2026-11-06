import { cva } from 'class-variance-authority';
import { StyleSheet, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly position?: TransactionListRowPositionEnum;
    readonly children: ReactNode;
    readonly separatorInset?: number;
    readonly className?: string;
}

const rowVariants = cva('bg-grouped-surface-row overflow-hidden', {
    variants: {
        position: {
            [TransactionListRowPositionEnum.FIRST]: 'rounded-t-3xl',
            [TransactionListRowPositionEnum.MIDDLE]: '',
            [TransactionListRowPositionEnum.LAST]: 'rounded-b-3xl mb-xl',
            [TransactionListRowPositionEnum.SINGLE]: 'rounded-3xl mb-xl'
        }
    }
});
const SEPARATED_POSITIONS = new Set([TransactionListRowPositionEnum.MIDDLE, TransactionListRowPositionEnum.LAST]);
const continuousCorners = { borderCurve: 'continuous' as const };

export const TransactionRowSurface = ({ position = TransactionListRowPositionEnum.SINGLE, children, separatorInset, className }: Props) => {
    const separatorStyle = { height: StyleSheet.hairlineWidth, left: separatorInset };

    return (
        <View className={cn(rowVariants({ position }), className)} style={continuousCorners}>
            {children}
            {isDefined(separatorInset) && SEPARATED_POSITIONS.has(position) ? (
                <View className="absolute top-0 right-0 bg-surface-separator" style={separatorStyle} pointerEvents="none" />
            ) : null}
        </View>
    );
};
