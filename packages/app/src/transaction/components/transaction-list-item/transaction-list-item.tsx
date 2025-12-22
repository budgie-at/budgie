import { Text, View } from 'react-native';

import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { TransactionCardPure } from '../transaction-card/transaction-card';

export const TransactionListItem = ({ item }: { item: TransactionListItemType }) =>
    item.type === 'header' ? (
        <View className="bg-primary-reverse py-sm">
            <Text className="text-secondary-foreground uppercase text-xs">{item.title}</Text>
        </View>
    ) : (
        <TransactionCardPure
            transaction={item.data.transaction}
            formattedAmount={item.data.formattedAmount}
            formattedDate={item.data.formattedDate}
            categoryLabel={item.data.categoryLabel}
        />
    );
