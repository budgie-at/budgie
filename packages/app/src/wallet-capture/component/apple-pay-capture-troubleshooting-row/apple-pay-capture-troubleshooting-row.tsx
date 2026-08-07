import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
    readonly description: string;
}

export const ApplePayCaptureTroubleshootingRow = ({ title, description }: Props) => (
    <View className="gap-y-xs">
        <Text className="text-primary text-sm font-semibold">{title}</Text>
        <Text className="text-secondary-foreground text-sm">{description}</Text>
    </View>
);
