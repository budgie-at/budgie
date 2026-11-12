import { Redirect } from 'expo-router';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { OnboardingICloudRestore } from '../../onboarding/component/onboarding-icloud-restore/onboarding-icloud-restore';

export default function OnboardingICloudRestoreScreen() {
    if (!IS_CLOUD_BACKUP_SUPPORTED) {
        return <Redirect href="/onboarding" />;
    }

    return <OnboardingICloudRestore />;
}
