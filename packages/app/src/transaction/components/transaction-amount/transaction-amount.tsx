import {
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionCardSelectors } from '../../../@e2e/selectors/transaction-card.selector';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { type: FOREGROUND_COLOR_PALETTE }
});

export const TransactionAmount = ({ transaction }: Props) => {
    const type = getTransactionType(transaction);
    const { decimalPlaces } = useSettingsContext();
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    const fromEntries = transaction.entries.filter(entry => entry.accountId === transaction.fromAccountId);
    const toEntries = transaction.entries.filter(entry => entry.accountId === transaction.toAccountId);
    const fromEntry = isNotEmptyArray(fromEntries) ? { ...fromEntries[0], amount: sumEntryAmounts(fromEntries) } : null;
    const toEntry = isNotEmptyArray(toEntries) ? { ...toEntries[0], amount: sumEntryAmounts(toEntries) } : null;

    const formatDigits = useFormatDigits(decimalPlaces);

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return (
            <View className="gap-y-xxl items-end" testID={TransactionCardSelectors.Amount(transaction.id)}>
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

        return (
            <Text
                className={amountVariants({ type: TRANSACTION_COLOR[type] })}
                testID={isAdjustment ? TransactionCardSelectors.AdjustmentAmount(amount) : TransactionCardSelectors.Amount(transaction.id)}
            >
                {formatDigits(amount, fromEntry.account.instrument.symbol)}
            </Text>
        );
    }

    if (isDefined(toEntry)) {
        const amount = convertFromMicroUnits(toEntry.amount);

        return (
            <Text
                className={amountVariants({ type: TRANSACTION_COLOR[type] })}
                testID={isAdjustment ? TransactionCardSelectors.AdjustmentAmount(amount) : TransactionCardSelectors.Amount(transaction.id)}
            >
                {formatDigits(amount, toEntry.account.instrument.symbol)}
            </Text>
        );
    }

    return null;
};
