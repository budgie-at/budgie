import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isNumber, isString } from '@rnw-community/shared';

interface Props {
    readonly label: ReactNode;
    readonly value: ReactNode;
    readonly testID?: string;
}

export const DepositDetailsRow = ({ label, value, testID }: Props) => {
    const isTextValue = isString(value) || isNumber(value);

    return (
        <View className="flex-row items-start justify-between gap-x-lg" testID={testID}>
            <View className="min-w-0 flex-1">
                <Text className="text-left text-secondary-foreground text-sm uppercase font-medium">{label}</Text>
            </View>

            <View className="min-w-0 flex-1 items-end">
                {isTextValue ? (
                    <Text className="text-right text-primary text-sm font-semibold">{value}</Text>
                ) : (
                    <View className="items-end">{value}</View>
                )}
            </View>
        </View>
    );
};
