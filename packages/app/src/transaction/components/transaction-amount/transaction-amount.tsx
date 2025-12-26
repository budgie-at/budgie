import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/components/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionType } from '../../utils/get-transaction-type.util';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { type: FOREGROUND_COLOR_PALETTE }
});

export const TransactionAmount = ({ transaction }: Props) => {
    const type = getTransactionType(transaction);
    const { decimalPlaces, defaultCurrency } = useSettingsContext();

    const fromEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
    const toEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

    const formatFromAmount = useFormatMoney(decimalPlaces, fromEntry?.account.instrument.code ?? defaultCurrency);
    const formatToAmount = useFormatMoney(decimalPlaces, toEntry?.account.instrument.code ?? defaultCurrency);

    console.log({ fromEntry: fromEntry?.account.instrument, toEntry: toEntry?.account.instrument });

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return (
            <View className="gap-y-xxl items-end">
                <Text className={amountVariants({ type: 'default' })}>{formatFromAmount(fromEntry.amount)}</Text>
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={ICONS.ArrowRightIcon} className="text-secondary-foreground" size={12} />
                    <Text className="text-secondary-foreground text-xxs">{formatToAmount(toEntry.amount)}</Text>
                </View>
            </View>
        );
    }

    if (isDefined(fromEntry)) {
        return <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>{formatFromAmount(fromEntry.amount)}</Text>;
    }

    if (isDefined(toEntry)) {
        return <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>{formatToAmount(toEntry.amount)}</Text>;
    }

    return null;
};
