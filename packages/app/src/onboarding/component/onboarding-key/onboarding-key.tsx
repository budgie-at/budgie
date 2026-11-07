import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingKeySelector } from './onboarding-key.selector';

export const OnboardingKey = () => {
    const { t } = useLingui();
    const { goToStep } = useOnboardingNavigation();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    const handlePinPress = () => void goToStep(OnboardingStepEnum.PIN);
    const handlePhoneLockPress = () => void goToStep(OnboardingStepEnum.PHONE_LOCK);

    const restoreAccessory = (
        <LoadingContent isLoading={isLoading}>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </LoadingContent>
    );
    const restorePressableProps = { disabled: isLoading, accessibilityState: { disabled: isLoading, busy: isLoading } };

    return (
        <OnboardingStepLayout step={OnboardingStepEnum.KEY} fileState={t`Not created yet`} fileLock={OnboardingFileLockEnum.OPEN}>
            <OnboardingStepIntro
                title={t`Who holds the key?`}
                description={t`Your money will live in one file on this phone. Choose who can open it.`}
            />

            <GroupedListSection footer={t`No account to sign up for. Never synced or uploaded. Works with no connection at all.`}>
                <GroupedListRow
                    testID={OnboardingKeySelector.PinOption}
                    left={<GroupedListIcon icon={UserIconNameEnum.KeyRound} />}
                    title={
                        <Text className="text-primary text-[17px]">
                            <Trans>Only me, with a PIN</Trans>
                        </Text>
                    }
                    subtitle={
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]">
                            <Trans>The PIN becomes the encryption key</Trans>
                        </Text>
                    }
                    onPress={handlePinPress}
                />
                <GroupedListRow
                    testID={OnboardingKeySelector.PhoneLockOption}
                    left={<GroupedListIcon icon={UserIconNameEnum.Smartphone} />}
                    title={
                        <Text className="text-primary text-[17px]">
                            <Trans>Anyone who can unlock this phone</Trans>
                        </Text>
                    }
                    subtitle={
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]">
                            <Trans>Add a PIN any time later</Trans>
                        </Text>
                    }
                    onPress={handlePhoneLockPress}
                />
            </GroupedListSection>

            <GroupedListSection title={t`Already use Budgie?`}>
                <GroupedListRow
                    testID={OnboardingKeySelector.RestoreButton}
                    left={<GroupedListIcon icon={UserIconNameEnum.ArchiveRestore} />}
                    title={
                        <Text className="text-primary text-[17px]">
                            <Trans>I have a Budgie backup</Trans>
                        </Text>
                    }
                    right={restoreAccessory}
                    pressableProps={restorePressableProps}
                    onPress={selectAndRestore}
                />
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};
