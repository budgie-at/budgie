import { UserIconNameEnum } from '@budgie/contracts';
import { ExporterService } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useExportAction } from '../../hook/use-export-action.hook';
import { shareCacheFile } from '../../utils/share-cache-file.util';

import { ExportCsvSelector } from './export-csv.selector';

export const ExportCsv = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportAction({
        exportAction: Effect.gen(function* () {
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
        }),
        successTitle: t`CSV exported`,
        successMessage: t`Your transaction file is ready to share.`,
        errorTitle: t`Could not export CSV`
    });

    const handlePress = () => void handleExport();

    return (
        <SettingsRow
            title={t`Export CSV`}
            subtitle={t`Every transaction as a spreadsheet`}
            {...(!isLoading && { onPress: handlePress })}
            icon={UserIconNameEnum.Upload}
            variant="ghost"
            right={<SettingsPillButton label={t`Export`} variant="secondary" isLoading={isLoading} />}
            testID={ExportCsvSelector.ExportCard}
        />
    );
};
