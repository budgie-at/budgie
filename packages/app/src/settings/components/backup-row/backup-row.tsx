import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useExportAction } from '../../../export/hook/use-export-action.hook';
import { DatabaseExportService } from '../../../export/service/database-export.service';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';

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
    const lastBackupLabel = hasBackup ? intl.formatDate(lastBackupAt, { day: 'numeric', month: 'short', year: 'numeric' }) : t`Not yet`;
    const backupLabel = hasBackup ? t`Last export` : t`Backup`;
    const lastBackupClassName = hasBackup ? 'text-primary' : 'text-warning-foreground';
    const buttonVariant = hasBackup ? 'secondary' : 'cta';
    const handleBackup = () => void handleExport();

    return (
        <View className="flex-row items-center gap-x-lg py-lg" testID={SettingsPageSelector.DataBackup}>
            <Text className="flex-1 text-sm text-secondary-foreground">{backupLabel}</Text>
            <Text className={cn('text-sm font-semibold', lastBackupClassName)}>{lastBackupLabel}</Text>
            <SettingsPillButton
                label={t`Back up`}
                onPress={handleBackup}
                variant={buttonVariant}
                isLoading={isLoading}
                testID={SettingsPageSelector.DataBackupButton}
            />
        </View>
    );
};
