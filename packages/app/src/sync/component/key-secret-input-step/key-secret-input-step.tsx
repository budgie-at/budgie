import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Input } from '../../../@generic/component/input/input';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

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
            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t`Use a read-only API key. Your key and secret are stored securely in the database and sync runs in the background.`}
            />

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
