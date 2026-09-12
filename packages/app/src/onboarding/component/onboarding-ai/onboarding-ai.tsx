import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingSuccessRow } from '../onboarding-success-row/onboarding-success-row';

import { OnboardingAiSelector } from './onboarding-ai.selector';

const logger = getLogger('OnboardingAi');

export const OnboardingAi = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const isAiEnabled = useSetting('isAiEnabled');

    const costPoints = [t`Downloads about 2.5 GB of models once`, t`Best on Wi-Fi`, t`You can turn this on later in Settings`];

    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.AI);
    const handleEnablePress = () => {
        void updateSettingsMutation({ isAiEnabled: true })
            .then(() => void goToNextStep(OnboardingStepEnum.AI))
            .catch((error: unknown) => {
                logger.error('enable failed', { errorMessage: getErrorMessage(error) });
            });
    };

    const primaryLabel = isAiEnabled ? t`Continue` : t`Enable on-device AI`;
    const handlePrimaryPress = isAiEnabled ? handlePrimary : handleEnablePress;

    const stepContent = isAiEnabled ? (
        <OnboardingSuccessRow label={t`On-device AI enabled`} testID={OnboardingAiSelector.SuccessRow} />
    ) : (
        <View className="gap-y-md">
            {costPoints.map(point => (
                <View key={point} className="flex-row items-start gap-x-md">
                    <Icon icon={UserIconNameEnum.BadgeInfo} size={16} className="text-secondary-foreground mt-xxs" />
                    <Text className="text-secondary-foreground text-sm leading-relaxed flex-1">{point}</Text>
                </View>
            ))}
        </View>
    );

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.AI}
            icon={UserIconNameEnum.Brain}
            title={t`Smarter, without the cloud`}
            description={t`Budgie can categorise transactions, suggest tags and transcribe voice notes — all on this device. Nothing is sent anywhere.`}
            primaryLabel={primaryLabel}
            onPrimary={handlePrimaryPress}
        >
            {stepContent}
        </OnboardingStepLayout>
    );
};
