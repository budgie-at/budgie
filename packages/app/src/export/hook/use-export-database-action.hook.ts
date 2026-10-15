import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { DatabaseExportService } from '../service/database-export.service';

import { useExportAction } from './use-export-action.hook';

export const useExportDatabaseAction = () => {
    const { t } = useLingui();

    return useExportAction({
        exportAction: () =>
            appRuntime.runPromise(Effect.flatMap(DatabaseExportService, databaseExportService => databaseExportService.exportAndShare())),
        successTitle: t`Database exported`,
        successMessage: t`Your database backup is ready to share.`,
        errorTitle: t`Could not export database`
    });
};
