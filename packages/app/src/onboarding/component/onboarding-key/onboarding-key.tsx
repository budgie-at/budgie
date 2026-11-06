import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useCloudBackups } from '../../../cloud-backup/hook/use-cloud-backups.hook';
import { CloudSyncInitialFetchRow } from '../../../cloud-sync/component/cloud-sync-initial-fetch-row/cloud-sync-initial-fetch-row';
import { useCloudSyncInitialFetch } from '../../../cloud-sync/hook/use-cloud-sync-initial-fetch.hook';
import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingKeySelector } from './onboarding-key.selector';

export const OnboardingKey = () => {
    const { t } = useLingui();
    const { goToStep, goToICloudRestore } = useOnboardingNavigation();
    const { selectAndRestore, isLoading } = useRestoreBackup();
    const { groups } = useCloudBackups();
    const { isFetching } = useCloudSyncInitialFetch();

    const handlePinPress = () => void goToStep(OnboardingStepEnum.PIN);
    const handlePhoneLockPress = () => void goToStep(OnboardingStepEnum.PHONE_LOCK);

    const iCloudRestoreRow =
        isNotEmptyArray(groups) && !isFetching ? (
            <GroupedListRow
                testID={OnboardingKeySelector.ICloudRestoreButton}
                left={<GroupedListIcon icon={UserIconNameEnum.CloudDownload} />}
                title={t`Restore from iCloud`}
                subtitle={t`Backups from your devices on this Apple Account`}
                onPress={goToICloudRestore}
            />
        ) : null;
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
                    title={t`Only me, with a PIN`}
                    subtitle={t`The PIN becomes the encryption key`}
                    onPress={handlePinPress}
                />
                <GroupedListRow
                    testID={OnboardingKeySelector.PhoneLockOption}
                    left={<GroupedListIcon icon={UserIconNameEnum.Smartphone} />}
                    title={t`Anyone who can unlock this phone`}
                    subtitle={t`Add a PIN any time later`}
                    onPress={handlePhoneLockPress}
                />
            </GroupedListSection>

            <GroupedListSection title={t`Already use Budgie?`}>
                {isFetching ? <CloudSyncInitialFetchRow /> : null}
                {iCloudRestoreRow}
                <GroupedListRow
                    testID={OnboardingKeySelector.RestoreButton}
                    left={<GroupedListIcon icon={UserIconNameEnum.ArchiveRestore} />}
                    title={t`I have a Budgie backup`}
                    right={restoreAccessory}
                    pressableProps={restorePressableProps}
                    onPress={selectAndRestore}
                />
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};
