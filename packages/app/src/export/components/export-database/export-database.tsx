import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useExportAction } from '../../hook/use-export-action.hook';
import { DatabaseExportService } from '../../service/database-export.service';

interface Props {
    readonly testID: string;
}

export const ExportDatabase = ({ testID }: Props) => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const { isLoading, handleExport } = useExportAction({
        exportAction: () =>
            appRuntime.runPromise(Effect.flatMap(DatabaseExportService, databaseExportService => databaseExportService.exportAndShare())),
        successTitle: t`Database exported`,
        successMessage: t`Your database backup is ready to share.`,
        errorTitle: t`Could not export database`
    });

    const description = isPinEnabled
        ? t`Sealed with your PIN. You choose where it goes.`
        : t`Not encrypted, because there's no PIN. You choose where it goes.`;

    return (
        <SettingsCard
            testID={testID}
            icon={UserIconNameEnum.Download}
            variant="cta"
            title={t`Export a backup`}
            description={description}
            isLoading={isLoading}
            onPress={handleExport}
        />
    );
};
