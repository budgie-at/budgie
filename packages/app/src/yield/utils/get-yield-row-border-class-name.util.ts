import { cn } from '../../@generic/utils/cn.util';
import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';

export const getYieldRowBorderClassName = (position: TransactionListRowPositionEnum): string =>
    cn(
        'dark:border-x-hairline',
        'dark:border-surface-separator',
        (position === TransactionListRowPositionEnum.FIRST || position === TransactionListRowPositionEnum.SINGLE) &&
            'dark:border-t-hairline',
        (position === TransactionListRowPositionEnum.LAST || position === TransactionListRowPositionEnum.SINGLE) && 'dark:border-b-hairline'
    );
