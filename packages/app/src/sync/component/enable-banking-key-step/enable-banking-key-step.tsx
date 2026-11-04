import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly applicationId: string;
    readonly isKeyPicked: boolean;
    readonly isLoading: boolean;
    readonly onApplicationIdChange: (applicationId: string) => void;
    readonly onPickKey: () => void;
}

export const EnableBankingKeyStep = ({ applicationId, isKeyPicked, isLoading, onApplicationIdChange, onPickKey }: Props) => {
    const { t } = useLingui();

    const pickKeyLabel = isKeyPicked ? t`Key file loaded. Choose another` : t`Choose key file (.pem)`;

    return (
        <>
            <View className="gap-y-md">
                <Text className="text-secondary-foreground text-sm px-md">
                    <Trans>Application ID</Trans>
                </Text>
                <Input
                    value={applicationId}
                    onChangeText={onApplicationIdChange}
                    placeholder={t`Filled in from the key file name`}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Button
                    variant="ghost"
                    leftIcon={UserIconNameEnum.KeyRound}
                    content={pickKeyLabel}
                    onPress={onPickKey}
                    disabled={isLoading}
                />
            </View>
        </>
    );
};
