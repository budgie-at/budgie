import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { TransactionConsolidationTypeEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionInfoDestinationEntry } from '../../utils/get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from '../../utils/get-transaction-info-primary-entry.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionInfoHeroIcon } from '../transaction-info-hero-icon/transaction-info-hero-icon';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRefundedPill } from '../transaction-info-refunded-pill/transaction-info-refunded-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
    readonly onOpenRefundSources?: () => void;
    readonly onTitleLayout: (event: LayoutChangeEvent) => void;
}

export const TransactionInfoHero = ({ transaction, matchingRuleIds, onOpenRefundSources, onTitleLayout }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();
    const amountClassName = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? 'text-positive-foreground' : 'text-primary';
    const title = getTransactionDisplayTitle(transaction);
    const sourceEntry = getTransactionInfoPrimaryEntry(transaction);
    const destinationEntry = getTransactionInfoDestinationEntry(transaction);
    const isCrossCurrency =
        isDefined(sourceEntry) &&
        isDefined(destinationEntry) &&
        sourceEntry.account.instrument.id !== destinationEntry.account.instrument.id;
    const destinationAmount =
        isCrossCurrency && isDefined(destinationEntry)
            ? `→ ${formatDigits(convertFromMicroUnits(destinationEntry.amount), destinationEntry.account.instrument.symbol)}`
            : null;
    const isTransfer = transaction.type === TransactionTypeEnum.TRANSFER;
    const transferRoute =
        isTransfer && isDefined(transaction.fromAccount) && isDefined(transaction.toAccount)
            ? `${transaction.fromAccount.title} → ${transaction.toAccount.title}`
            : null;
    const showRefundedPill = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const showPills = showRefundedPill || isNotEmptyArray(matchingRuleIds);

    return (
        <View className="items-center pt-3xl pb-7xl">
            <TransactionInfoHeroIcon transaction={transaction} />

            <AmountField fontSize={40} className="mt-xl self-stretch">
                <AmountFieldText className={cn('leading-[48px] font-semibold tracking-[-1px] text-center', amountClassName)} selectable>
                    {formatTransactionInfoAmount(transaction, formatDigits)}
                </AmountFieldText>
            </AmountField>

            {isNotEmptyString(destinationAmount) ? (
                <Text className="text-[15px] leading-[20px] text-secondary-foreground tabular-nums" selectable>
                    {destinationAmount}
                </Text>
            ) : null}

            {isNotEmptyString(title) ? (
                <Text
                    className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center"
                    selectable
                    onLayout={onTitleLayout}
                >
                    {title}
                </Text>
            ) : null}

            <Text className="mt-sm text-[15px] leading-[20px] text-secondary-foreground text-center">
                {formatDayAndMonthAndYearWithTime(transaction.operatedAt)}
            </Text>

            {isNotEmptyString(transferRoute) ? (
                <Text className="mt-xxs text-[15px] leading-[20px] text-secondary-foreground text-center" numberOfLines={2}>
                    {transferRoute}
                </Text>
            ) : null}

            {showPills ? (
                <View className="mt-xl flex-row flex-wrap items-center justify-center gap-sm">
                    {showRefundedPill ? (
                        <TransactionInfoRefundedPill
                            key={`${transaction.id}-${transaction.consolidationType}`}
                            transaction={transaction}
                            onPress={onOpenRefundSources}
                            testID={TransactionInfoPageSelector.RefundedPill}
                        />
                    ) : null}

                    {isNotEmptyArray(matchingRuleIds) ? (
                        <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
                    ) : null}
                </View>
            ) : null}
        </View>
    );
};
