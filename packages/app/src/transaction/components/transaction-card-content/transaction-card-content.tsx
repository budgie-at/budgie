import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isEarnedIncomeTransaction } from '../../utils/is-earned-income-transaction.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionRowLayout } from '../transaction-row-layout/transaction-row-layout';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const neutralIconVariant = getTransactionType(transaction) === TransactionTypeEnum.TRANSFER ? 'default' : 'secondary';
    const isUncategorized = isUncategorizedTransaction(transaction);
    const iconVariant = isEarnedIncomeTransaction(transaction) && !isUncategorized ? 'positive' : neutralIconVariant;
    const iconClassName = iconVariant === 'secondary' ? 'bg-secondary-foreground/15' : '';
    const icon = isUncategorized ? UserIconNameEnum.CircleDashed : getTransactionIcon(transaction);
    const iconForegroundClassName = isUncategorized ? 'text-attention-foreground' : '';

    return (
        <TransactionRowLayout
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
        >
            {isAdjustment ? (
                <Text className="text-primary text-[15px] font-semibold" numberOfLines={1} testID={TransactionCardSelector.AdjustmentBadge}>
                    <Trans>Balance Adjustment</Trans>
                </Text>
            ) : (
                <Text className="text-primary text-[15px] font-semibold" numberOfLines={1} ellipsizeMode="tail">
                    {getTransactionDisplayTitle(transaction)}
                </Text>
            )}

            <TransactionCardSubtitle transaction={transaction} accountId={accountId} />
        </TransactionRowLayout>
    );
};
