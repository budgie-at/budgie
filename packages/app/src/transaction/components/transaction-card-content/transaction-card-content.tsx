import {
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCardCategory } from '../transaction-card-category/transaction-card-category';
import { TransactionCardDebtSettlement } from '../transaction-card-debt-settlement/transaction-card-debt-settlement';
import { TransactionCardFee } from '../transaction-card-fee/transaction-card-fee';
import { TransactionCardRefunded } from '../transaction-card-refunded/transaction-card-refunded';
import { TransactionCardTags } from '../transaction-card-tags/transaction-card-tags';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    return (
        <View className="flex-row items-start gap-x-xl">
            <CircleIcon
                size={36}
                iconSize={18}
                radius={18}
                border={false}
                className="self-center"
                icon={categoryIcon}
                variant={TRANSACTION_COLOR[type]}
            />

            <View className="flex-1 min-w-0 gap-y-xxs">
                <View className="flex-row items-center gap-x-xs">
                    {isAdjustment ? (
                        <Text
                            className="text-primary text-[15px] font-semibold shrink"
                            numberOfLines={1}
                            testID={TransactionCardSelector.AdjustmentBadge}
                        >
                            <Trans>Balance Adjustment</Trans>
                        </Text>
                    ) : (
                        <Text className="text-primary text-[15px] font-semibold shrink" numberOfLines={1} ellipsizeMode="tail">
                            {getTransactionDisplayTitle(transaction)}
                        </Text>
                    )}

                    {isDefined(transaction.receipt) ? (
                        <View testID={TransactionCardSelector.ReceiptPill(transaction.id)}>
                            <Icon icon={UserIconNameEnum.Receipt} size={13} className="text-secondary-foreground" />
                        </View>
                    ) : null}
                </View>

                <View className="flex-row items-center overflow-hidden">
                    <TransactionCardRefunded transaction={transaction} />
                    <TransactionCardCategory transaction={transaction} />
                    <TransactionCardAccountInfo transaction={transaction} accountId={accountId} />
                    <TransactionCardDebtSettlement transaction={transaction} />
                    <TransactionCardFee transaction={transaction} />
                    <Text className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'shrink-0')} numberOfLines={1}>
                        {formatMonthAndDay(transaction.operatedAt)}
                    </Text>
                    <TransactionCardTags transaction={transaction} />
                </View>
            </View>

            <TransactionAmount transaction={transaction} accountId={accountId} />
        </View>
    );
};
