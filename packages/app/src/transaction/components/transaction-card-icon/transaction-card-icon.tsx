import { TransactionTypeEnum, TransactionWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isEarnedIncomeTransaction } from '../../utils/is-earned-income-transaction.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardIcon = ({ transaction }: Props) => {
    const neutralIconVariant = getTransactionType(transaction) === TransactionTypeEnum.TRANSFER ? 'default' : 'secondary';
    const isUncategorized = isUncategorizedTransaction(transaction);
    const iconVariant = isEarnedIncomeTransaction(transaction) && !isUncategorized ? 'positive' : neutralIconVariant;
    const iconClassName = iconVariant === 'secondary' ? 'bg-secondary-foreground/15' : '';
    const icon = isUncategorized ? UserIconNameEnum.CircleDashed : getTransactionIcon(transaction);
    const iconForegroundClassName = cn(
        isUncategorized && 'text-attention-foreground',
        iconVariant === 'positive' && 'text-positive-strong'
    );

    return (
        <CircleIcon
            size={36}
            iconSize={20}
            radius={18}
            border={false}
            icon={icon}
            variant={iconVariant}
            className={iconClassName}
            iconClassName={iconForegroundClassName}
        />
    );
};
