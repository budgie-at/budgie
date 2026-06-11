import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { RefundedPill } from '../refunded-pill/refunded-pill';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';
import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { TransactionInfoHeroPropsInterface } from '../../interface/transaction-info-hero-props.interface';

const getTypeLabel = (type: TransactionTypeEnum, t: ReturnType<typeof useLingui>['t']): string => {
    if (type === TransactionTypeEnum.EXPENSE) {
        return t`Expense`;
    }

    if (type === TransactionTypeEnum.INCOME) {
        return t`Income`;
    }

    return t`Transfer`;
};

const getPrimaryEntry = (transaction: TransactionInfoHeroPropsInterface['transaction']) => {
    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.entries.find(entry => entry.accountId === transaction.toAccountId) ?? transaction.entries.at(0);
    }

    return transaction.entries.find(entry => entry.accountId === transaction.fromAccountId) ?? transaction.entries.at(0);
};

const getSecondaryTransferEntry = (transaction: TransactionInfoHeroPropsInterface['transaction']) =>
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
    transaction: TransactionInfoHeroPropsInterface['transaction'],
    amount: number,
    currencySymbol: string,
    formatDigits: (value: number, symbol?: string) => string
): string => `${getAmountPrefix(transaction.type)}${formatDigits(amount, currencySymbol)}`;

export const TransactionInfoHero = ({
    transaction,
    categoryLabel,
    matchingRuleIds,
    onOpenRefundSources
}: TransactionInfoHeroPropsInterface) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const variant = TRANSACTION_COLOR[getTransactionType(transaction)];
    const primaryEntry = getPrimaryEntry(transaction);
    const secondaryEntry = getSecondaryTransferEntry(transaction);
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeCurrencySymbol = feeEntries.at(0)?.account.instrument.symbol ?? primaryEntry?.account.instrument.symbol ?? '';
    const title = isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
    const amount = isDefined(primaryEntry) ? convertFromMicroUnits(primaryEntry.amount) : 0;
    const currencySymbol = primaryEntry?.account.instrument.symbol ?? '';
    const formattedAmount = getFormattedAmount(transaction, amount, currencySymbol, formatDigits);
    const secondaryAmount = isDefined(secondaryEntry)
        ? formatDigits(convertFromMicroUnits(secondaryEntry.amount), secondaryEntry.account.instrument.symbol)
        : null;

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

            <View className="flex-row flex-wrap justify-center gap-xs">
                <TransactionMetaPill label={getTypeLabel(transaction.type, t)} icon={UserIconNameEnum.ReceiptText} />
                {isNotEmptyString(categoryLabel) ? <TransactionMetaPill label={categoryLabel} icon={UserIconNameEnum.Tags} /> : null}
                <RefundedPill transaction={transaction} onPress={onOpenRefundSources} />
                <TransactionFeePill amount={feeAmount} currencySymbol={feeCurrencySymbol} />
            </View>

            {isNotEmptyArray(matchingRuleIds) ? (
                <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
            ) : null}
        </View>
    );
};
