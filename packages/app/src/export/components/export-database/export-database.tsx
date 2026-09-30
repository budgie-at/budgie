import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useExportAction } from '../../hook/use-export-action.hook';
import { DatabaseExportService } from '../../service/database-export.service';

export const ExportDatabase = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportAction({
        exportAction: () =>
            appRuntime.runPromise(Effect.flatMap(DatabaseExportService, databaseExportService => databaseExportService.exportAndShare())),
        successTitle: t`Database exported`,
        successMessage: t`Your database backup is ready to share.`,
        errorTitle: t`Could not export database`
    });

    return (
        <SettingsCard
            title={t`Export Database`}
            description={t`Create a backup of all your data`}
            onPress={handleExport}
            icon={UserIconNameEnum.Database}
            variant="default"
            isLoading={isLoading}
            testID={SettingsPageSelector.ExportDatabaseCard}
        />
    );
};
