import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Button } from '../../../@generic/components/button/button';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

interface Props {
    readonly onSubmit: (enableBiometrics: boolean) => void;
}

export const BiometricConfiguration = ({ onSubmit }: Props) => {
    const [enableBiometrics, setEnableBiometrics] = useState(true);
    const { t } = useLingui();

    const handleContinue = () => void onSubmit(enableBiometrics);

    return (
        <View className="gap-y-[32px] flex-1 justify-center">
            <View className="rounded-full bg-secondary-background p-[32px] mx-auto">
                <Icon icon={ICONS.Fingerprint} className="text-primary" size={80} />
            </View>

            <View className="gap-y-xl">
                <Text className="text-4_5xl font-semibold text-primary text-center">
                    <Trans>Enable biometric unlock?</Trans>
                </Text>

                <Text className="text-md text-secondary-foreground text-center">
                    <Trans>Use Face ID or Touch ID to unlock your app quickly and securely</Trans>
                </Text>
            </View>

            <SettingsCard
                title={t`Biometric Authentication`}
                description={t`Face ID / Touch ID`}
                right={<Switch className="my-auto" onValueChange={setEnableBiometrics} value={enableBiometrics} />}
                left={<CircleIcon size="1_5xl" icon={ICONS.Fingerprint} variant="ghost" border={false} />}
            />

            <Button onPress={handleContinue} content={t`Continue`} />
        </View>
    );
};
