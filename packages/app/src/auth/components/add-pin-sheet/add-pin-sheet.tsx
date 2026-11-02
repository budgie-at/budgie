import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { useBiometricLabel } from '../../../settings/hook/use-biometric-label.hook';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';
import { PinSheetLayout } from '../pin-sheet-layout/pin-sheet-layout';

import { AddPinSheetSelector } from './add-pin-sheet.selector';

export const AddPinSheet = () => {
    const { t } = useLingui();

    const handleChoosePinPress = () => void router.replace({ pathname: '/pin-setup', params: { mode: PinSetupModeEnum.CREATE } });
    const handleNotNowPress = () => void router.back();

    const biometricLabel = useBiometricLabel();
    const biometricStep = isDefined(biometricLabel) ? t`Optionally turn on ${biometricLabel}` : t`Sealed. Only your PIN opens it.`;
    const steps = [t`Choose and confirm a PIN`, t`Budgie encrypts your data on this phone. It takes a few seconds.`, biometricStep];

    return (
        <PinSheetLayout
            testID={AddPinSheetSelector.Root}
            className="bg-sheet-surface"
            iconVariant="warning"
            title={t`Lock Budgie with a PIN`}
            description={t`Right now anyone who can unlock your phone can open Budgie. With a PIN, the file itself is encrypted and only opens with it.`}
        >
            <Card variant="secondary" size="md" className="gap-y-md">
                {steps.map((step, index) => (
                    <View key={step} className="flex-row items-start gap-x-md">
                        <Text className="text-secondary-foreground text-sm w-4">{index + 1}</Text>
                        <Text className="text-primary text-sm flex-1">{step}</Text>
                    </View>
                ))}
            </Card>

            <View className="flex-row items-center gap-x-md">
                <Icon icon={UserIconNameEnum.TriangleAlert} size={16} className="text-warning-foreground" />
                <Text className="text-warning-foreground text-sm flex-1">
                    <Trans>A forgotten PIN can&apos;t be reset.</Trans>
                </Text>
            </View>

            <View className="gap-y-md">
                <Button
                    testID={AddPinSheetSelector.ChoosePinButton}
                    variant="cta"
                    content={t`Choose a PIN`}
                    onPress={handleChoosePinPress}
                />
                <Button testID={AddPinSheetSelector.NotNowButton} variant="ghost" content={t`Not now`} onPress={handleNotNowPress} />
            </View>
        </PinSheetLayout>
    );
};
