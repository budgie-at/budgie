import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { minuteClockAtom } from '../../../@generic/constant/minute-clock-atom.constant';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useBackupActions } from '../../../export/hook/use-backup-actions.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsActionRow } from '../settings-action-row/settings-action-row';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';
import { SettingsRow } from '../settings-row/settings-row';
import { SettingsWarningSubtitle } from '../settings-warning-subtitle/settings-warning-subtitle';

export const BackupRow = () => {
    const { t } = useLingui();
    const { formatRelativeToNow } = useFormatDate();
    const now = AsyncResult.getOrElse(useAtomValue(minuteClockAtom), Date.now);
    const lastBackupAt = useSetting('lastBackupAt');
    const { isLoading, handleBackup, handleShare } = useBackupActions();

    const hasBackup = isDefined(lastBackupAt);
    const savedAgo = hasBackup ? formatRelativeToNow(lastBackupAt, now) : '';
    const subtitle = hasBackup ? t`Saved ${savedAgo}` : <SettingsWarningSubtitle>{t`Never saved`}</SettingsWarningSubtitle>;
    const discVariant = hasBackup ? 'ghost' : 'warning';
    const buttonVariant = hasBackup ? 'secondary' : 'cta';

    return (
        <>
            <SettingsRow
                icon={UserIconNameEnum.HardDriveUpload}
                variant={discVariant}
                title={t`Backup file`}
                testID={SettingsPageSelector.DataBackup}
                subtitle={subtitle}
                right={
                    <SettingsPillButton
                        label={t`Back up`}
                        onPress={handleBackup}
                        variant={buttonVariant}
                        isLoading={isLoading}
                        testID={SettingsPageSelector.DataBackupButton}
                    />
                }
            />
            <SettingsActionRow
                icon={UserIconNameEnum.Share}
                title={t`Share a backup file`}
                subtitle={t`Save it to Files or send it`}
                onPress={handleShare}
                isLoading={isLoading}
                testID={SettingsPageSelector.DataBackupShareButton}
            />
        </>
    );
};
