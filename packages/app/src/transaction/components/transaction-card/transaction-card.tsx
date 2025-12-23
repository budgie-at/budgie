import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionCardAccountInfo } from '../transaction-card-account-info/transaction-card-account-info';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const amountVariants = cva('text-md', {
    variants: {
        type: FOREGROUND_COLOR_PALETTE
    }
});

export const TransactionCard = ({ transaction }: Props) => {
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency, true);
    const { formatMonthAndDayWithTime } = useFormatDate();

    const categoryIcon = getTransactionIcon(transaction);

    const handleNavigate = () => void router.push(`/transactions/${transaction.id}`);
    const transactionType = getTransactionType(transaction);

    return (
        <Card onPress={handleNavigate} className="gap-y-7xl p-xl">
            <View className="flex-row gap-x-xl">
                <CircleIcon size="md" icon={ICONS[categoryIcon]} variant={TRANSACTION_COLOR[transactionType]} />

                <View className="flex-1 gap-y-sm pt-xs">
                    {isNotEmptyString(transaction.title) || isNotEmptyString(transaction.comment) ? (
                        <View className="gap-y-xxs">
                            {isNotEmptyString(transaction.title) ? <Text>{transaction.title}</Text> : null}
                            {isNotEmptyString(transaction.comment) ? <Text>{transaction.comment}</Text> : null}
                        </View>
                    ) : null}

                    <TransactionCategoryBadge transaction={transaction} />
                </View>

                <Text className={amountVariants({ type: TRANSACTION_COLOR[transactionType] })}>{formatMoney(transaction.amount)}</Text>
            </View>

            <View className="flex-row justify-between">
                <TransactionCardAccountInfo transaction={transaction} />

                <Text className="text-xs text-secondary-foreground">{formatMonthAndDayWithTime(transaction.operatedAt)}</Text>
            </View>
        </Card>
    );
};
