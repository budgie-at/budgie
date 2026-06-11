import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    InstrumentTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

interface AggregatedEntry {
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly kind: TransactionEntryKindEnum;
    readonly type: TransactionEntryTypeEnum;
    readonly account: TransactionWithRelationsEntityInterface['entries'][number]['account'];
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { type: FOREGROUND_COLOR_PALETTE }
});

const sumEntryBaseAmounts = (entries: TransactionWithRelationsEntityInterface['entries']): number | null => {
    if (entries.some(entry => !isDefined(entry.baseAmount))) {
        return null;
    }

    return entries.reduce((sum, entry) => sum + (entry.baseAmount ?? 0), 0);
};

const getAggregatedEntry = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null): AggregatedEntry | null => {
    const entries = transaction.entries.filter(entry => entry.accountId === accountId);

    return isNotEmptyArray(entries) ? { ...entries[0], amount: sumEntryAmounts(entries), baseAmount: sumEntryBaseAmounts(entries) } : null;
};

const getContextualEntry = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null): AggregatedEntry | null => {
    const entry = getAggregatedEntry(transaction, accountId);

    if (!isDefined(entry) || entry.account.id === transaction.fromAccountId || entry.account.id === transaction.toAccountId) {
        return null;
    }

    return entry;
};

const getAmountTestID = (isAdjustment: boolean, amount: number, transactionId: number) =>
    isAdjustment ? TransactionCardSelector.AdjustmentAmount(amount) : TransactionCardSelector.Amount(transactionId);

const getDebtSettlementAmountColor = (entry: AggregatedEntry | null): ColorPaletteVariant | null => {
    if (!isDefined(entry) || entry.kind !== TransactionEntryKindEnum.DEBT_SETTLEMENT || entry.account.type !== AccountTypeEnum.DEBT) {
        return null;
    }

    const isDebtReduction =
        (entry.account.debtType === AccountDebtTypeEnum.LENT && entry.type === TransactionEntryTypeEnum.CREDIT) ||
        (entry.account.debtType === AccountDebtTypeEnum.BORROW && entry.type === TransactionEntryTypeEnum.DEBIT);

    return isDebtReduction ? 'positive' : 'warning';
};

const getDisplayState = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const contextualEntry = getContextualEntry(transaction, accountId);
    const fromEntry =
        contextualEntry?.type === TransactionEntryTypeEnum.CREDIT
            ? contextualEntry
            : getAggregatedEntry(transaction, transaction.fromAccountId);
    const toEntry =
        contextualEntry?.type === TransactionEntryTypeEnum.DEBIT
            ? contextualEntry
            : getAggregatedEntry(transaction, transaction.toAccountId);

    return {
        type: getTransactionType(transaction),
        isAdjustment: isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction),
        contextualEntry,
        fromEntry,
        toEntry
    };
};

// eslint-disable-next-line max-statements -- Cross-currency display requires additional variables
export const TransactionAmount = ({ transaction, accountId = null }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { type, isAdjustment, contextualEntry, fromEntry, toEntry } = getDisplayState(transaction, accountId);
    const debtSettlementAmountColor = getDebtSettlementAmountColor(contextualEntry);

    if (isDefined(contextualEntry) && isDefined(debtSettlementAmountColor)) {
        const amount = convertFromMicroUnits(contextualEntry.amount);
        const isCrossCurrency = contextualEntry.account.instrument.id !== defaultInstrument.id;

        return (
            <View className="items-end" testID={TransactionCardSelector.Amount(transaction.id)}>
                <Text className={amountVariants({ type: debtSettlementAmountColor })}>
                    {formatDigits(amount, contextualEntry.account.instrument.symbol)}
                </Text>
                {isCrossCurrency ? (
                    <ConvertedAmountLabel
                        instrumentId={contextualEntry.account.instrument.id}
                        instrumentSymbol={contextualEntry.account.instrument.symbol}
                        amount={contextualEntry.amount}
                        baseAmount={contextualEntry.baseAmount}
                        shouldShowExchangeRate={contextualEntry.account.instrument.type === InstrumentTypeEnum.CRYPTO}
                    />
                ) : null}
            </View>
        );
    }

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return (
            <View className="gap-y-xxl items-end" testID={TransactionCardSelector.Amount(transaction.id)}>
                <Text className={amountVariants({ type: 'default' })}>
                    {formatDigits(convertFromMicroUnits(fromEntry.amount), fromEntry.account.instrument.symbol)}
                </Text>
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={UserIconNameEnum.ArrowRight} className="text-secondary-foreground" size={12} />
                    <Text className="text-secondary-foreground text-xxs">
                        {formatDigits(convertFromMicroUnits(toEntry.amount), toEntry.account.instrument.symbol)}
                    </Text>
                </View>
            </View>
        );
    }

    if (isDefined(fromEntry)) {
        const amount = convertFromMicroUnits(fromEntry.amount);
        const amountTestID = getAmountTestID(isAdjustment, amount, transaction.id);
        const isCrossCurrency = fromEntry.account.instrument.id !== defaultInstrument.id;

        return (
            <View className="items-end" testID={amountTestID}>
                <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>
                    {formatDigits(amount, fromEntry.account.instrument.symbol)}
                </Text>
                {isCrossCurrency ? (
                    <ConvertedAmountLabel
                        instrumentId={fromEntry.account.instrument.id}
                        instrumentSymbol={fromEntry.account.instrument.symbol}
                        amount={fromEntry.amount}
                        baseAmount={fromEntry.baseAmount}
                        shouldShowExchangeRate={fromEntry.account.instrument.type === InstrumentTypeEnum.CRYPTO}
                    />
                ) : null}
            </View>
        );
    }

    if (isDefined(toEntry)) {
        const amount = convertFromMicroUnits(toEntry.amount);
        const amountTestID = getAmountTestID(isAdjustment, amount, transaction.id);
        const isCrossCurrency = toEntry.account.instrument.id !== defaultInstrument.id;

        return (
            <View className="items-end" testID={amountTestID}>
                <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>
                    {formatDigits(amount, toEntry.account.instrument.symbol)}
                </Text>
                {isCrossCurrency ? (
                    <ConvertedAmountLabel
                        instrumentId={toEntry.account.instrument.id}
                        instrumentSymbol={toEntry.account.instrument.symbol}
                        amount={toEntry.amount}
                        baseAmount={toEntry.baseAmount}
                        shouldShowExchangeRate={toEntry.account.instrument.type === InstrumentTypeEnum.CRYPTO}
                    />
                ) : null}
            </View>
        );
    }

    return null;
};
