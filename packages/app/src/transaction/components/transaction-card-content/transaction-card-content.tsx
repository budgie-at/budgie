import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useTransactionRowTitle } from '../../hook/use-transaction-row-title.hook';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isEarnedIncomeTransaction } from '../../utils/is-earned-income-transaction.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardStackedSubtitle } from '../transaction-card-stacked-subtitle/transaction-card-stacked-subtitle';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const displayTitle = useTransactionRowTitle(transaction);

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
    const { t } = useLingui();
    const titleLineCount = isAccessibilityTextSize ? 0 : 1;
    const adjustmentTitle = isNotEmptyString(transaction.title) ? transaction.title : t`Balance Adjustment`;

    const titleNode = isAdjustment ? (
        <Text
            className="text-primary text-[17px] font-semibold"
            numberOfLines={titleLineCount}
            testID={TransactionCardSelector.AdjustmentBadge}
        >
            {adjustmentTitle}
        </Text>
    ) : (
        <Text className="text-primary text-[17px] font-semibold" numberOfLines={titleLineCount} ellipsizeMode="tail">
            {displayTitle}
        </Text>
    );
    const detail = isAccessibilityTextSize ? (
        <TransactionCardStackedSubtitle transaction={transaction} accountId={accountId} />
    ) : (
        <TransactionCardSubtitle transaction={transaction} accountId={accountId} />
    );

    return (
        <ListRow
            leading={
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
            }
            title={titleNode}
            trailing={<TransactionAmount transaction={transaction} accountId={accountId} />}
            detail={detail}
        />
    );
};
