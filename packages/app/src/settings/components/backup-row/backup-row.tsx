import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useExportAction } from '../../../export/hook/use-export-action.hook';
import { DatabaseExportService } from '../../../export/service/database-export.service';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';
import { SettingsRow } from '../settings-row/settings-row';

export const BackupRow = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const lastBackupAt = useSetting('lastBackupAt');
    const { isLoading, handleExport } = useExportAction({
        exportAction: Effect.flatMap(DatabaseExportService, databaseExportService => databaseExportService.exportAndShare()),
        successTitle: t`Backup file ready`,
        successMessage: t`Save it to Files or another app.`,
        errorTitle: t`Could not create a backup`
    });

    const hasBackup = isDefined(lastBackupAt);
    const isBackupThisYear = hasBackup && isThisYear(lastBackupAt);
    const lastBackupDate = hasBackup
        ? intl.formatDate(lastBackupAt, {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              ...(!isBackupThisYear && { year: 'numeric' })
          })
        : '';
    const lastBackupLabel = hasBackup ? t`Last created ${lastBackupDate}` : t`Not created yet`;
    const lastBackupClassName = hasBackup ? 'text-secondary-foreground' : 'text-warning-foreground';
    const discVariant = hasBackup ? 'ghost' : 'warning';
    const buttonVariant = hasBackup ? 'secondary' : 'cta';
    const handleBackup = () => void handleExport();

    return (
        <SettingsRow
            icon={UserIconNameEnum.HardDriveUpload}
            variant={discVariant}
            title={t`Backup file`}
            testID={SettingsPageSelector.DataBackup}
            {...(!isLoading && { onPress: handleBackup })}
            subtitle={
                <Text className={cn('text-[13px] leading-[18px]', lastBackupClassName)} numberOfLines={2}>
                    {lastBackupLabel}
                </Text>
            }
            right={
                <SettingsPillButton
                    label={t`Back up`}
                    variant={buttonVariant}
                    isLoading={isLoading}
                    testID={SettingsPageSelector.DataBackupButton}
                />
            }
        />
    );
};
