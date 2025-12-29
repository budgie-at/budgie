import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { type: FOREGROUND_COLOR_PALETTE }
});

export const TransactionAmount = ({ transaction }: Props) => {
    const type = getTransactionType(transaction);
    const { decimalPlaces } = useSettingsContext();

    const fromEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
    const toEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

    const formatDigits = useFormatDigits(decimalPlaces);

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return (
            <View className="gap-y-xxl items-end">
                <Text className={amountVariants({ type: 'default' })}>
                    {formatDigits(convertFromMicroUnits(fromEntry.amount), fromEntry.account.instrument.symbol)}
                </Text>
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon="ArrowRightIcon" className="text-secondary-foreground" size={12} />
                    <Text className="text-secondary-foreground text-xxs">
                        {formatDigits(convertFromMicroUnits(toEntry.amount), toEntry.account.instrument.symbol)}
                    </Text>
                </View>
            </View>
        );
    }

    if (isDefined(fromEntry)) {
        return (
            <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>
                {formatDigits(convertFromMicroUnits(fromEntry.amount), fromEntry.account.instrument.symbol)}
            </Text>
        );
    }

    if (isDefined(toEntry)) {
        return (
            <Text className={amountVariants({ type: TRANSACTION_COLOR[type] })}>
                {formatDigits(convertFromMicroUnits(toEntry.amount), toEntry.account.instrument.symbol)}
            </Text>
        );
    }

    return null;
};
