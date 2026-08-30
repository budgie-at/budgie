import { Text, View } from 'react-native';

interface Props {
    readonly content: string;
    readonly index: number;
}

export const ApplePayCaptureSetupRow = ({ content, index }: Props) => (
    <View className="flex-row gap-x-lg">
        <Text className="text-secondary-foreground text-sm font-semibold">{index + 1}.</Text>
        <Text className="text-primary text-sm flex-1">{content}</Text>
    </View>
);
