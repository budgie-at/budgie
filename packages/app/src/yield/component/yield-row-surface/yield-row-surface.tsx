import { cn } from '../../../@generic/utils/cn.util';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly position?: TransactionListRowPositionEnum;
    readonly children: ReactNode;
}

const SEPARATOR_INSET = 64;

export const YieldRowSurface = ({ position = TransactionListRowPositionEnum.SINGLE, children }: Props) => {
    const hasTopBorder = position === TransactionListRowPositionEnum.FIRST || position === TransactionListRowPositionEnum.SINGLE;
    const hasBottomBorder = position === TransactionListRowPositionEnum.LAST || position === TransactionListRowPositionEnum.SINGLE;
    const className = cn(
        'dark:border-x-hairline',
        'dark:border-surface-separator',
        hasTopBorder && 'dark:border-t-hairline',
        hasBottomBorder && 'dark:border-b-hairline'
    );

    return (
        <TransactionRowSurface position={position} separatorInset={SEPARATOR_INSET} className={className}>
            {children}
        </TransactionRowSurface>
    );
};
