import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

export const EnableBankingWaitingStep = () => (
    <View className="items-center gap-y-md py-3xl">
        <ActivityIndicator />
        <Text className="text-primary text-lg font-semibold text-center">
            <Trans>Finish authorizing at your bank</Trans>
        </Text>
        <Text className="text-secondary-foreground text-sm text-center px-xl">
            <Trans>Budgie continues when you return. If you stay in the browser, use the Return to Budgie link on the page.</Trans>
        </Text>
    </View>
);
