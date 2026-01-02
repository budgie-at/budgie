import { Text, View } from 'react-native';

interface Props {
    readonly label: React.ReactNode;
    readonly value: string;
}

export const SummaryRow = ({ label, value }: Props) => (
    <View className="flex-row justify-between py-1">
        <Text className="text-sm text-secondary-foreground">{label}</Text>
        <Text className="text-sm font-medium text-primary">{value}</Text>
    </View>
);
