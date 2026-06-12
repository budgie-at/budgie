import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly testID?: string;
}

export const TransactionMetadataRow = ({ label, testID }: Props) => (
    <View className="flex-row items-center gap-x-xs min-w-0" testID={testID}>
        <Text className="text-secondary-foreground text-xs flex-1 min-w-0" numberOfLines={1} ellipsizeMode="tail">
            {label}
        </Text>
    </View>
);
