import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useExportAction } from '../../hook/use-export-action.hook';
import { exporterService } from '../../service/exporter.service';

import { ExportCsvSelector as CsvPageSelectors } from './export-csv.selector';

export const ExportCsv = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportAction(() => exporterService.saveAndShare());

    return (
        <SettingsCard
            title={t`Export CSV`}
            description={t`Export all transactions to a CSV file`}
            onPress={handleExport}
            icon={UserIconNameEnum.Download}
            variant="default"
            isLoading={isLoading}
            testID={CsvPageSelectors.ExportCard}
        />
    );
};
