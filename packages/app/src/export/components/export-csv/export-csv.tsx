import { UserIconNameEnum } from '@budgie/contracts';
import { ExporterService } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useExportAction } from '../../hook/use-export-action.hook';
import { shareCacheFile } from '../../utils/share-cache-file.util';

import { ExportCsvSelector } from './export-csv.selector';

export const ExportCsv = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportAction({
        exportAction: () =>
            appRuntime.runPromise(
                Effect.gen(function* () {
                    const exporterService = yield* ExporterService;
                    const csvContent = yield* exporterService.exportToCsv();

                    yield* shareCacheFile(
                        'budgie-export',
                        'csv',
                        file =>
                            Effect.sync(() => {
                                file.create();
                                file.writeSync(csvContent);
                            }),
                        { mimeType: 'text/csv' }
                    );
                })
            ),
        successTitle: t`CSV exported`,
        successMessage: t`Your transaction file is ready to share.`,
        errorTitle: t`Could not export CSV`
    });

    return (
        <SettingsCard
            title={t`Export CSV`}
            description={t`Export all transactions to a CSV file`}
            onPress={handleExport}
            icon={UserIconNameEnum.Download}
            variant="default"
            isLoading={isLoading}
            testID={ExportCsvSelector.ExportCard}
        />
    );
};
