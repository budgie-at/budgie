import { TransactionConsolidationTypeEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
    readonly onOpenRefundSources?: () => void;
}

const getPrimaryEntry = (transaction: TransactionWithRelationsEntityInterface) => {
    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.entries.find(entry => entry.accountId === transaction.toAccountId) ?? transaction.entries.at(0);
    }

    return transaction.entries.find(entry => entry.accountId === transaction.fromAccountId) ?? transaction.entries.at(0);
};

const getSecondaryTransferEntry = (transaction: TransactionWithRelationsEntityInterface) =>
    transaction.type === TransactionTypeEnum.TRANSFER
        ? transaction.entries.find(entry => entry.accountId === transaction.toAccountId)
        : null;

const getAmountPrefix = (type: TransactionTypeEnum): string => {
    if (type === TransactionTypeEnum.EXPENSE) {
        return '-';
    }

    if (type === TransactionTypeEnum.INCOME) {
        return '+';
    }

    return '';
};

const getFormattedAmount = (
    transaction: TransactionWithRelationsEntityInterface,
    amount: number,
    currencySymbol: string,
    formatDigits: (value: number, symbol?: string) => string
): string => `${getAmountPrefix(transaction.type)}${formatDigits(amount, currencySymbol)}`;

export const TransactionInfoHero = ({ transaction, matchingRuleIds, onOpenRefundSources }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const variant = TRANSACTION_COLOR[getTransactionType(transaction)];
    const primaryEntry = getPrimaryEntry(transaction);
    const secondaryEntry = getSecondaryTransferEntry(transaction);
    const title = getTransactionDisplayTitle(transaction);
    const amount = isDefined(primaryEntry) ? convertFromMicroUnits(primaryEntry.amount) : 0;
    const currencySymbol = primaryEntry?.account.instrument.symbol ?? '';
    const formattedAmount = getFormattedAmount(transaction, amount, currencySymbol, formatDigits);
    const secondaryAmount = isDefined(secondaryEntry)
        ? formatDigits(convertFromMicroUnits(secondaryEntry.amount), secondaryEntry.account.instrument.symbol)
        : null;
    const showMetaPills = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;

    return (
        <View className="items-center gap-y-xl py-4xl">
            <CircleIcon
                icon={getTransactionIcon(transaction)}
                variant={variant}
                size={76}
                iconSize={34}
                radius={24}
                className="rounded-5xl"
            />

            <View className="items-center gap-y-sm">
                <Text className={cn('text-5xl font-semibold text-center', FOREGROUND_COLOR_PALETTE[variant])} selectable>
                    {formattedAmount}
                </Text>
                {isNotEmptyString(secondaryAmount) ? (
                    <View className="flex-row items-center gap-x-xs">
                        <TransactionMetaPill icon={UserIconNameEnum.ArrowRight} label={secondaryAmount} />
                    </View>
                ) : null}
            </View>

            {isNotEmptyString(title) ? (
                <Text className="text-2xl text-primary font-semibold text-center" numberOfLines={2} selectable>
                    {title}
                </Text>
            ) : null}

            {showMetaPills ? (
                <View className="flex-row flex-wrap justify-center gap-xs">
                    <RefundedPill
                        key={`${transaction.id}-${transaction.consolidationType}`}
                        transaction={transaction}
                        onPress={onOpenRefundSources}
                        testID={TransactionInfoPageSelector.RefundedPill}
                    />
                </View>
            ) : null}

            {isNotEmptyArray(matchingRuleIds) ? (
                <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
            ) : null}
        </View>
    );
};
