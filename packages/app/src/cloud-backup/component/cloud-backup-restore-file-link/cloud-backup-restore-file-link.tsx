import { useLingui } from '@lingui/react/macro';

import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { CloudBackupListSelector } from '../cloud-backup-list/cloud-backup-list.selector';

export const CloudBackupRestoreFileLink = () => {
    const { t } = useLingui();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    const handlePress = () => void selectAndRestore();

    return (
        <SettingsPillButton
            label={t`Restore from a file instead`}
            variant="secondary"
            isLoading={isLoading}
            onPress={handlePress}
            testID={CloudBackupListSelector.RestoreFromFileLink}
        />
    );
};
