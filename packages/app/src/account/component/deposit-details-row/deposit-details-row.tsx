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
        <View className="items-end gap-y-xs" testID={testID}>
            <Text className="text-right text-secondary-foreground text-sm uppercase font-medium">{label}</Text>

            {isTextValue ? (
                <Text className="text-right text-primary text-sm font-semibold">{value}</Text>
            ) : (
                <View className="items-end">{value}</View>
            )}
        </View>
    );
};
