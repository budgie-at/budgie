import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { getTransactionInfoHeroIconVariant } from '../../utils/get-transaction-info-hero-icon-variant.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoHeroIcon = ({ transaction }: Props) => {
    const isUncategorized = isUncategorizedTransaction(transaction);
    const variant = getTransactionInfoHeroIconVariant(transaction);
    const icon = isUncategorized ? UserIconNameEnum.CircleDashed : UserIconNameEnum.ReceiptText;
    const className = variant === 'secondary' ? 'bg-secondary-foreground/15' : '';
    const iconClassName = cn(
        isUncategorized && 'text-attention-foreground',
        variant === 'positive' && 'text-positive-strong',
        variant === 'default' && 'text-default-foreground'
    );

    return (
        <CircleIcon
            icon={icon}
            variant={variant}
            size={64}
            iconSize={30}
            radius={32}
            border={false}
            className={className}
            iconClassName={iconClassName}
        />
    );
};
