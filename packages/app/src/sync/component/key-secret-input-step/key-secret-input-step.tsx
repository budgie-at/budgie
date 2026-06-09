import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Input } from '../../../@generic/component/input/input';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';

interface Props {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly onApiKeyChange: (apiKey: string) => void;
    readonly onApiSecretChange: (apiSecret: string) => void;
}

export const KeySecretInputStep = ({ apiKey, apiSecret, onApiKeyChange, onApiSecretChange }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <SyncCredentialsStepHeader provider={ExternalSourceEnum.BINANCE} />

            <View className="gap-y-md">
                <Text className="text-secondary-foreground text-sm px-md">
                    <Trans>Paste your Binance API key:</Trans>
                </Text>
                <Input
                    value={apiKey}
                    onChangeText={onApiKeyChange}
                    placeholder={t`Enter your Binance API key`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                />
            </View>

            <View className="gap-y-md">
                <Text className="text-secondary-foreground text-sm px-md">
                    <Trans>Paste your Binance API secret:</Trans>
                </Text>
                <Input
                    value={apiSecret}
                    onChangeText={onApiSecretChange}
                    placeholder={t`Enter your Binance API secret`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                />
            </View>
        </>
    );
};
