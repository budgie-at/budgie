import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    readonly label: ReactNode;
    readonly value: ReactNode;
    readonly testID?: string;
}

export const DepositDetailsRow = ({ label, value, testID }: Props) => (
    <View className="flex-row items-center justify-between" testID={testID}>
        <Text className="text-secondary-foreground text-sm uppercase font-medium">{label}</Text>
        <Text className="text-primary text-sm font-semibold">{value}</Text>
    </View>
);
