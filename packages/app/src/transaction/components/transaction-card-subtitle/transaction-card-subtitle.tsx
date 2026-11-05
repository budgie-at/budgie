import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useTransactionCardSubtitle } from '../../hook/use-transaction-card-subtitle.hook';
import { TransactionReceiptMarker } from '../transaction-receipt-marker/transaction-receipt-marker';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { description, accessibilityLabel, accountTitle, subtitleTestID } = useTransactionCardSubtitle(transaction, accountId);

    if (!isNotEmptyString(description) && !isDefined(accountTitle) && !isDefined(transaction.receipt)) {
        return null;
    }

    return (
        <View className="flex-row items-start gap-x-xs">
            {isDefined(transaction.receipt) ? <TransactionReceiptMarker transactionId={transaction.id} /> : null}
            <View className="flex-1 min-w-0 gap-y-xxs">
                {isNotEmptyString(description) ? (
                    <Text
                        accessibilityLabel={accessibilityLabel}
                        className="text-[13px] text-secondary-foreground"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                    >
                        {description}
                    </Text>
                ) : null}
                {isDefined(accountTitle) ? (
                    <Text className="text-[12px] text-secondary-foreground" numberOfLines={1} ellipsizeMode="middle">
                        {accountTitle}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};
