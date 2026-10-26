import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly value: string;
}

export const WalletCaptureReviewDetailRow = ({ label, value }: Props) => (
    <View className="flex-row items-center justify-between gap-x-xl">
        <Text className="text-secondary-foreground text-sm">{label}</Text>
        <Text className="text-primary text-sm font-medium flex-1 text-right" numberOfLines={1}>
            {value}
        </Text>
    </View>
);
