import { Text, View } from 'react-native';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { FileBankSyncReviewTransactionInterface } from '@budgie/sync';

interface Props {
    readonly transaction: FileBankSyncReviewTransactionInterface;
}

export const FileImportReviewRow = ({ transaction }: Props) => {
    const { intl } = useI18nContext();
    const formatDigits = useDisplayFormatDigits();

    const operatedOn = intl.formatDate(transaction.operatedAt, { day: '2-digit', month: '2-digit' });
    const signPrefix = transaction.signedAmount > 0 ? '+' : '';
    const amount = `${signPrefix}${formatDigits(transaction.signedAmount)} ${transaction.currencyCode}`;

    return (
        <View className="flex-row items-center gap-x-lg py-md">
            <Text className="text-secondary-foreground text-xs w-12">{operatedOn}</Text>
            <Text className="text-primary text-sm flex-1" numberOfLines={1}>
                {transaction.description}
            </Text>
            <Text className="text-primary text-sm font-medium">{amount}</Text>
        </View>
    );
};
