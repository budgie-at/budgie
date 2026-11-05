import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useContext } from 'react';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionAccountTitlePrefixContext } from '../../context/transaction-account-title-prefix.context';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isEarnedIncomeTransaction } from '../../utils/is-earned-income-transaction.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { stripTransactionAccountTitlePrefix } from '../../utils/strip-transaction-account-title-prefix.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardLayout } from '../transaction-card-layout/transaction-card-layout';
import { TransactionCardStackedSubtitle } from '../transaction-card-stacked-subtitle/transaction-card-stacked-subtitle';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const accountTitlePrefix = useContext(TransactionAccountTitlePrefixContext);

    const title = getTransactionDisplayTitle(transaction);
    const displayTitle = stripTransactionAccountTitlePrefix(title, accountTitlePrefix) ?? title;
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const neutralIconVariant = getTransactionType(transaction) === TransactionTypeEnum.TRANSFER ? 'default' : 'secondary';
    const isUncategorized = isUncategorizedTransaction(transaction);
    const iconVariant = isEarnedIncomeTransaction(transaction) && !isUncategorized ? 'positive' : neutralIconVariant;
    const iconClassName = iconVariant === 'secondary' ? 'bg-secondary-foreground/15' : '';
    const icon = isUncategorized ? UserIconNameEnum.CircleDashed : getTransactionIcon(transaction);
    const iconForegroundClassName = cn(
        isUncategorized && 'text-attention-foreground',
        iconVariant === 'positive' && 'text-positive-strong'
    );
    const titleLineCount = isAccessibilityTextSize ? 4 : 1;

    const titleContent = (
        <Text
            className="text-primary text-[15px] font-semibold"
            numberOfLines={titleLineCount}
            ellipsizeMode="tail"
            {...(isAdjustment && { testID: TransactionCardSelector.AdjustmentBadge })}
        >
            {isAdjustment ? <Trans>Balance Adjustment</Trans> : displayTitle}
        </Text>
    );

    return (
        <TransactionCardLayout
            icon={
                <CircleIcon
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    icon={icon}
                    variant={iconVariant}
                    className={iconClassName}
                    iconClassName={iconForegroundClassName}
                />
            }
            amount={<TransactionAmount transaction={transaction} accountId={accountId} />}
            title={titleContent}
        >
            {isAccessibilityTextSize ? (
                <TransactionCardStackedSubtitle transaction={transaction} accountId={accountId} />
            ) : (
                <TransactionCardSubtitle transaction={transaction} accountId={accountId} />
            )}
        </TransactionCardLayout>
    );
};
