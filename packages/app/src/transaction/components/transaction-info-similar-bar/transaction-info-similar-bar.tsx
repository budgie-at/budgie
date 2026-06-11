import { Text, View } from 'react-native';

import type { TransactionInfoSimilarBarPropsInterface } from '../../interface/transaction-info-similar-bar-props.interface';

export const TransactionInfoSimilarBar = ({ height, label }: TransactionInfoSimilarBarPropsInterface) => {
    const barStyle = { height };

    return (
        <View className="flex-1 items-center gap-y-xs justify-end">
            <View className="w-full rounded-t-lg bg-default-foreground" style={barStyle} />
            <Text className="text-xxs text-secondary-foreground">{label}</Text>
        </View>
    );
};
