import { Trans } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams();

    return (
        <View className="p-[100px]">
            <Text className="text-primary text-3xl font-semibold">
                <Trans>Transaction Details</Trans>
            </Text>
            <Text className="text-primary text-3xl font-semibold">
                <Trans>Transaction ID: {id}</Trans>
            </Text>
        </View>
    );
}
