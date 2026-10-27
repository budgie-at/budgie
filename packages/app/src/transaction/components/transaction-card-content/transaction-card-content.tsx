import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCardTags } from '../transaction-card-tags/transaction-card-tags';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';
import { TransactionMetadataRows } from '../transaction-metadata-rows/transaction-metadata-rows';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const { formatMonthAndDayWithTime } = useFormatDate();
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);

    const title = getTransactionDisplayTitle(transaction);
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;
    const refundedPillTestID = TransactionCardSelector.RefundedPill(transaction.id);
    const feeTestID = TransactionCardSelector.FeeMetadata(transaction.id);
    const debtSettlementTestID = TransactionCardSelector.DebtSettlementMetadata(transaction.id);

    return (
        <>
            <View className="flex-row gap-x-xl">
                <CircleIcon size={32} iconSize={16} icon={categoryIcon} variant={TRANSACTION_COLOR[type]} />

                <View className="flex-1 gap-y-xs pt-xxs">
                    {isNotEmptyString(title) ? (
                        <Text className="text-primary text-sm font-semibold" numberOfLines={2} ellipsizeMode="tail">
                            {title}
                        </Text>
                    ) : null}

                    {isNotEmptyString(comment) ? (
                        <Text className="text-secondary-foreground text-xs" numberOfLines={2} ellipsizeMode="tail">
                            {comment}
                        </Text>
                    ) : null}

                    <TransactionMetadataRows
                        transaction={transaction}
                        refundedPillTestID={refundedPillTestID}
                        feeTestID={feeTestID}
                        debtSettlementTestID={debtSettlementTestID}
                    />

                    {transaction.type === TransactionTypeEnum.TRANSFER || transaction.type === TransactionTypeEnum.DEBT ? null : (
                        <TransactionCategoryBadge transaction={transaction} />
                    )}
                </View>

                <TransactionAmount transaction={transaction} accountId={accountId} />
            </View>

            <View className="flex-row items-end flex-1 gap-x-lg">
                <View className="flex-1 min-w-0">
                    <TransactionCardAccountInfo transaction={transaction} accountId={accountId} />
                </View>

                <View className="items-end gap-y-xs shrink-0">
                    <TransactionCardTags transaction={transaction} />
                    <Text className="text-xs text-secondary-foreground">{formatMonthAndDayWithTime(transaction.operatedAt)}</Text>
                </View>
            </View>
        </>
    );
};
