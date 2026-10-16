import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { OnboardingStepIntro } from '../../../onboarding/component/onboarding-step-intro/onboarding-step-intro';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';

import { AddPinSheetSelector } from './add-pin-sheet.selector';

export const AddPinSheet = () => {
    const { t } = useLingui();
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const handleChoosePinPress = () => void router.replace({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CREATE } });
    const handleNotNowPress = () => void router.back();

    const fileSize = formatFileSize(databaseFileSize);
    const steps = [
        t`Choose and confirm a PIN`,
        t`Budgie re-encrypts ${DB_NAME} (${fileSize}) on this phone. It takes a few seconds.`,
        t`Sealed. Face ID or fingerprint is optional.`
    ];

    return (
        <View
            testID={AddPinSheetSelector.Root}
            collapsable={false}
            className="flex-1 bg-primary-reverse px-5xl pt-7xl pb-safe-or-[16px] gap-y-3xl"
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.KeyRound}
                iconVariant="warning"
                title={t`Lock Budgie with your own PIN`}
                description={t`Right now anyone who can unlock your phone can open Budgie. With a PIN, the file itself is encrypted and only opens with it.`}
            />

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
        </View>
    );
};
