import { File, Paths } from 'expo-file-system';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { IMPORT_PRESETS } from '../../import/constant/import-presets.constant';
import { ImportPresetEnum } from '../../import/enum/import-preset.enum';
import { ImporterService } from '../../import/service/importer.service';
import { countCsvRows } from '../../import/util/csv-parser.util';
import {
    accountBalanceRepository,
    accountRepository,
    categoryRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../drizzle/db/db';
import { readTextFileFromUri } from '../utils/read-text-file-from-uri.util';

const E2E_FIXTURES_FOLDER = String.raw`E2EFixtures`;
const E2E_CSV_IMPORT_FILE = String.raw`e2e-budgie-import.csv`;
const E2E_CSV_EXPORT_FILE = String.raw`budgie-e2e-export.csv`;

class AppE2ECsvService {
    getImportFixtureUri(): string {
        const fixtureFile = new File(Paths.document, E2E_FIXTURES_FOLDER, E2E_CSV_IMPORT_FILE);

        if (!fixtureFile.exists) {
            throw new Error(fixtureFile.name);
        }

        return fixtureFile.uri;
    }

    async importExportedCsv(): Promise<void> {
        const exportFile = new File(Paths.cache, E2E_CSV_EXPORT_FILE);

        if (!exportFile.exists) {
            throw new Error(exportFile.name);
        }

        await this.importBudgieCsvFromUri(exportFile.uri);
    }

    async importFixtureCsv(): Promise<void> {
        await this.importBudgieCsvFromUri(this.getImportFixtureUri());
    }

    saveExportedCsv(csvContent: string): string {
        const exportFile = new File(Paths.cache, E2E_CSV_EXPORT_FILE);

        if (exportFile.exists) {
            exportFile.delete();
        }

        exportFile.create();
        exportFile.write(csvContent);

        return exportFile.uri;
    }

    async importBudgieCsvFromUri(sourceUri: string): Promise<void> {
        const csvText = await readTextFileFromUri(sourceUri);
        const totalRows = await countCsvRows(csvText);
        const importer = new ImporterService(IMPORT_PRESETS[ImportPresetEnum.Budgie]);

        await accountRepository.truncate();
        await categoryRepository.truncate(false);
        await transactionTagsRepository.truncate();
        await transactionEntryRepository.truncate();
        await transactionRepository.truncate();
        await accountBalanceRepository.truncate();

        await importer.process(csvText, totalRows);
        await accountBalanceIncrementalService.updateAllBalances(true);
    }
}

export const appE2ECsvService = new AppE2ECsvService();
