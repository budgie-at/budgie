import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingInfoRow } from '../onboarding-info-row/onboarding-info-row';
import { OnboardingOptionRow } from '../onboarding-option-row/onboarding-option-row';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingKeySelector } from './onboarding-key.selector';

export const OnboardingKey = () => {
    const { t } = useLingui();
    const { goToStep } = useOnboardingNavigation();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    const handlePinPress = () => void goToStep(OnboardingStepEnum.PIN);
    const handlePhoneLockPress = () => void goToStep(OnboardingStepEnum.PHONE_LOCK);

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.KEY}
            fileState={t`Will be created on this phone`}
            footer={
                <Button
                    testID={OnboardingKeySelector.RestoreButton}
                    variant="ghost"
                    content={t`I have a Budgie backup`}
                    onPress={selectAndRestore}
                    isLoading={isLoading}
                />
            }
        >
            <OnboardingStepIntro
                title={t`Who holds the key?`}
                description={t`Your money will live in one file on this phone. Choose who can open it.`}
            />

            <Card variant="secondary" size="md" className="gap-y-lg">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon icon={UserIconNameEnum.Database} variant="primary" size={36} iconSize={18} />
                    <View className="flex-1">
                        <Text className="text-primary text-sm font-semibold">{DB_NAME}</Text>
                        <Text className="text-secondary-foreground text-xs">
                            <Trans>Will be created on this phone</Trans>
                        </Text>
                    </View>
                </View>

                <View className="gap-y-md border-t border-secondary-corner pt-lg">
                    <OnboardingInfoRow icon={UserIconNameEnum.UserX} text={t`No account. There's nothing to sign up for.`} />
                    <OnboardingInfoRow icon={UserIconNameEnum.CloudOff} text={t`Never synced, never uploaded.`} />
                    <OnboardingInfoRow icon={UserIconNameEnum.WifiOff} text={t`Works with no connection at all.`} />
                </View>
            </Card>

            <View className="gap-y-md">
                <OnboardingOptionRow
                    testID={OnboardingKeySelector.PinOption}
                    icon={UserIconNameEnum.KeyRound}
                    title={t`Only me, with a PIN`}
                    description={t`The PIN becomes the encryption key`}
                    isSelected={false}
                    onPress={handlePinPress}
                />
                <OnboardingOptionRow
                    testID={OnboardingKeySelector.PhoneLockOption}
                    icon={UserIconNameEnum.Smartphone}
                    title={t`Anyone who can unlock this phone`}
                    description={t`Add a PIN any time later`}
                    isSelected={false}
                    onPress={handlePhoneLockPress}
                />
            </View>
        </OnboardingStepLayout>
    );
};
