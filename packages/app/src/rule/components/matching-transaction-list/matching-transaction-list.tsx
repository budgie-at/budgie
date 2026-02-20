import { TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MatchingTransactionRow } from '../matching-transaction-row/matching-transaction-row';

interface Props {
    readonly transactions: TransactionWithEntriesMccCategoryEntityInterface[];
    readonly totalCount: number;
    readonly onShowAll: () => void;
}

export const MatchingTransactionList = ({ transactions, totalCount, onShowAll }: Props) => {
    if (!isNotEmptyArray(transactions)) {
        return null;
    }

    const hasMoreTransactions = totalCount > transactions.length;

    const showAllLink = hasMoreTransactions ? (
        <HapticPressable onPress={onShowAll}>
            <Text className="text-xs text-primary font-medium text-center py-sm">
                <Trans>Show all ({totalCount})</Trans>
            </Text>
        </HapticPressable>
    ) : null;

    return (
        <View className="gap-y-xs">
            {transactions.map(transaction => (
                <MatchingTransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {showAllLink}
        </View>
    );
};
