import { TransactionAssociationEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
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
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionCategoryBadge } from '../transaction-category-badge/transaction-category-badge';

import { TransactionCardAccountInfo } from './transaction-card-account-info';

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
    // TODO: We take 1st entry, but is this correct?
    const transactionInstrument = useGetInstrumentByIdQuery(transaction[TransactionAssociationEnum.ENTRIES][0].instrumentId);
    const formatMoney = useFormatMoney(decimalPlaces, transactionInstrument.instrument?.code ?? defaultCurrency, true);
    const { formatMonthAndDay } = useFormatDate();

    const categoryIcon = getTransactionIcon(transaction);

    const handleNavigate = () => void router.push(`/transactions/${transaction.id}`);
    const transactionType = getTransactionType(transaction);

    return (
        <Card onPress={handleNavigate} className="flex-row items-center gap-x-xl p-xl">
            <CircleIcon size="md" icon={ICONS[categoryIcon]} variant={TRANSACTION_COLOR[transactionType]} />

            <View className="flex-1 gap-y-xxs">
                {isNotEmptyString(transaction.title) ? <Text className="text-primary text-sm">{transaction.title}</Text> : null}

                <View className="gap-y-md">
                    <View className="flex-row items-center gap-x-sm flex-wrap">
                        <Text className="text-xs text-secondary-foreground">{formatMonthAndDay(transaction.operatedAt)}</Text>
                        <TransactionCardAccountInfo transaction={transaction} />
                    </View>

                    <TransactionCategoryBadge transaction={transaction} />
                </View>
            </View>

            <Text className={amountVariants({ type: TRANSACTION_COLOR[transactionType] })}>{formatMoney(transaction.amount)}</Text>
        </Card>
    );
};
