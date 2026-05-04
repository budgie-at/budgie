import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClass?: string;
}

export const SyncDataRow = ({ label, value, valueClass = 'text-primary' }: Props) => (
    <View className="flex-row justify-between">
        <Text className="text-xs text-secondary-foreground">{label}</Text>
        <Text className={`text-xs ${valueClass}`}>{value}</Text>
    </View>
);
