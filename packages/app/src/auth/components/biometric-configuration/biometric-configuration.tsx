import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly onSubmit: (enableBiometrics: boolean) => void;
}

export const BiometricConfiguration = ({ onSubmit }: Props) => {
    const [enableBiometrics, setEnableBiometrics] = useState(true);
    const { t } = useLingui();

    const handleContinue = () => void onSubmit(enableBiometrics);

    return (
        <View className="gap-y-8 flex-1 justify-center">
            <View className="rounded-full bg-secondary-background p-8 mx-auto">
                <Icon icon={UserIconNameEnum.Fingerprint} className="text-primary" size={80} />
            </View>

            <View className="gap-y-xl">
                <Text className="text-4.5xl font-semibold text-primary text-center">
                    <Trans>Enable biometric unlock?</Trans>
                </Text>

                <Text className="text-md text-secondary-foreground text-center">
                    <Trans>Use Face ID or Touch ID to unlock your app quickly and securely</Trans>
                </Text>
            </View>

            <SettingsCard
                icon={UserIconNameEnum.Fingerprint}
                variant="ghost"
                title={t`Biometric Authentication`}
                description={t`Face ID / Touch ID`}
                right={
                    <ThemedSwitch
                        className="my-auto"
                        testID={PinFormSelector.BiometricSetupSwitch}
                        onValueChange={setEnableBiometrics}
                        value={enableBiometrics}
                    />
                }
            />

            <Button testID={PinFormSelector.ContinueButton} onPress={handleContinue} content={t`Continue`} />
        </View>
    );
};
