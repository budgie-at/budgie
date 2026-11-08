import { useLingui } from '@lingui/react/macro';

import { CloudBackupList } from '../../../cloud-backup/component/cloud-backup-list/cloud-backup-list';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

export const OnboardingICloudRestore = () => {
    const { t } = useLingui();

    return (
        <OnboardingStepLayout step={OnboardingStepEnum.KEY} fileState={t`Not created yet`} fileLock={OnboardingFileLockEnum.OPEN}>
            <OnboardingStepIntro
                title={t`Restore from iCloud`}
                description={t`Bring back your Budgie data from a backup on any of your devices.`}
            />

            <CloudBackupList />
        </OnboardingStepLayout>
    );
};
