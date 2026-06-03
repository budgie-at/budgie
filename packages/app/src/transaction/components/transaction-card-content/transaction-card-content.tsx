import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCardTags } from '../transaction-card-tags/transaction-card-tags';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string | null;
}

export const TransactionCardContent = ({ transaction, formattedDate, categoryLabel }: Props) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;
    const refundedPillTestID = TransactionCardSelector.RefundedPill(transaction.id);
    const feePillTestID = TransactionCardSelector.FeePill(transaction.id);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(getTransactionFeeEntries(transaction.entries)));

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

                    <View className="flex-row flex-wrap gap-xs">
                        <RefundedPill transaction={transaction} testID={refundedPillTestID} />
                        <TransactionFeePill
                            amount={feeAmount}
                            currencySymbol={transaction.entries[0]?.account.instrument.symbol ?? ''}
                            testID={feePillTestID}
                        />
                    </View>

                    {transaction.type === TransactionTypeEnum.TRANSFER || transaction.type === TransactionTypeEnum.DEBT ? null : (
                        <TransactionCategoryBadge transaction={transaction} categoryLabel={categoryLabel} />
                    )}
                </View>

                <TransactionAmount transaction={transaction} />
            </View>

            <View className="flex-row items-end flex-1 gap-x-lg">
                <View className="flex-1 min-w-0">
                    <TransactionCardAccountInfo transaction={transaction} />
                </View>

                <View className="items-end gap-y-xs shrink-0">
                    <TransactionCardTags transaction={transaction} />
                    <Text className="text-xs text-secondary-foreground">{formattedDate}</Text>
                </View>
            </View>
        </>
    );
};
