import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
    readonly message: string;
    readonly messageClassName: string;
    readonly numberOfLines: number;
    readonly testID: string;
}

export const SyncMessageRow = ({ title, message, messageClassName, numberOfLines, testID }: Props) => (
    <View className="gap-y-xs">
        <Text className="text-xs text-secondary-foreground">{title}</Text>
        <Text className={messageClassName} numberOfLines={numberOfLines} testID={testID}>
            {message}
        </Text>
    </View>
);
