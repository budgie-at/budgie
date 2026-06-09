import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Input } from '../../../@generic/component/input/input';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';

interface Props {
    readonly token: string;
    readonly onTokenChange: (token: string) => void;
}

export const TokenInputStep = ({ token, onTokenChange }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <SyncCredentialsStepHeader provider={ExternalSourceEnum.MONOBANK} />

            <View className="gap-y-md">
                <Text className="text-secondary-foreground text-sm px-md">
                    <Trans>Paste your API token below:</Trans>
                </Text>

                <View className="flex-row items-center gap-x-sm">
                    <Input
                        className="flex-1"
                        value={token}
                        onChangeText={onTokenChange}
                        placeholder={t`Enter your Monobank API token`}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry
                    />
                    <PasteTokenButton onPaste={onTokenChange} />
                </View>
            </View>
        </>
    );
};
