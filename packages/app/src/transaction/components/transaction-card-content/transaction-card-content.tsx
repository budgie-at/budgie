import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useRefundedSummary } from '../../hook/use-refunded-summary.hook';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCardTags } from '../transaction-card-tags/transaction-card-tags';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly formattedDate: string;
    readonly categoryLabel: string;
}

export const TransactionCardContent = ({ transaction, formattedDate, categoryLabel }: Props) => {
    const categoryIcon = getTransactionIcon(transaction);
    const type = getTransactionType(transaction);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const [openConsolidationSourceModal] = useConsolidationSourceModal();

    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const comment = isNotEmptyString(transaction.title) ? transaction.comment : null;

    const refundSummary = useRefundedSummary(transaction);
    const refundCurrencySymbol = transaction.entries[0]?.account.instrument.symbol;
    const formattedRefundedAmount =
        isDefined(refundSummary) && refundSummary.kind === 'partial' && isNotEmptyString(refundCurrencySymbol)
            ? formatDigits(convertFromMicroUnits(refundSummary.refundsTotal), refundCurrencySymbol)
            : undefined; // eslint-disable-line no-undefined -- optional prop, undefined skips it

    const handleRefundPillPress = () => {
        void openConsolidationSourceModal({ transactionId: transaction.id });
    };

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

                    {isDefined(refundSummary) ? (
                        <View className="flex-row">
                            <RefundedPill
                                kind={refundSummary.kind}
                                formattedRefundedAmount={formattedRefundedAmount}
                                onPress={handleRefundPillPress}
                            />
                        </View>
                    ) : null}

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
