import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Switch } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useAuth } from '../../../auth/context/auth.context';
import { AuthService } from '../../../auth/context/auth.service';
import { GenericSelectorCard } from '../../../settings/components/generic-selector-card/generic-selector-card';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

export function SecuritySettings() {
    const { t } = useLingui();
    const { isPinEnabled, disablePin } = useAuth();
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const available = await AuthService.isBiometricAvailable();
        setBiometricAvailable(available);

        if (available && isPinEnabled) {
            const enabled = await AuthService.isBiometricEnabled();
            setBiometricEnabled(enabled);
        }
    };

    const handleEnablePin = () => {
        router.push('/settings/setup-pin');
    };

    const toggleBiometric = async (value: boolean) => {
        if (value) {
            const success = await AuthService.authenticateWithBiometrics();
            if (success) {
                await AuthService.setBiometricEnabled(true);
                setBiometricEnabled(true);
            }
        } else {
            await AuthService.setBiometricEnabled(false);
            setBiometricEnabled(false);
        }
    };

    const handleDisablePin = () => {
        Alert.alert(t`Disable PIN`, t`Are you sure you want to disable PIN protection?`, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: t`Disable`,
                style: 'destructive',
                onPress: async () => {
                    await disablePin();
                    setBiometricEnabled(false);
                }
            }
        ]);
    };

    if (!isPinEnabled) {
        return (
            <GenericSelectorCard
                onPress={handleEnablePin}
                title={t`Enable PIN Protection`}
                description={t`Secure your app with a PIN code`}
                icon="Lock"
                iconVariant="default"
            />
        );
    }

    return (
        <>
            {biometricAvailable && (
                <SettingsCard
                    title={t`Biometric Authentication`}
                    description={t`Use Face ID or Touch ID`}
                    left={<CircleIcon variant="ghost" icon={ICONS.Fingerprint} />}
                    right={<Switch value={biometricEnabled} onValueChange={toggleBiometric} />}
                />
            )}

            <GenericSelectorCard
                onPress={handleDisablePin}
                title={t`Disable PIN`}
                description={t`Turn off PIN protection`}
                icon="LockOpen"
                iconVariant="destructive"
            />
        </>
    );
}
