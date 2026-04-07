import { File, Paths } from 'expo-file-system';

import { databaseImportService } from '../../import/service/database-import.service';

const E2E_FIXTURE_FILE_MAP = {
    '08-settings-navigation': 'e2e-08-settings-navigation.db',
    '09-expense-transaction': 'e2e-09-expense-transaction.db',
    '10-income-transaction': 'e2e-10-income-transaction.db',
    '11-transfer-transaction': 'e2e-11-transfer-transaction.db',
    '12-cross-currency-transfer-transaction': 'e2e-12-cross-currency-transfer-transaction.db',
    '13-balance-verification': 'e2e-13-balance-verification.db',
    '15-archived-accounts': 'e2e-15-archived-accounts.db',
    '17-expense-to-transfer': 'e2e-17-expense-to-transfer.db',
    '18-income-to-transfer': 'e2e-18-income-to-transfer.db',
    '19-transactions-filters': 'e2e-19-transactions-filters.db',
    '20-transactions-account-date': 'e2e-20-transactions-account-date.db',
    'rules-base': 'e2e-rules-base.db'
} as const;

type E2EFixtureId = keyof typeof E2E_FIXTURE_FILE_MAP;

class AppE2EFixtureImportService {
    async importFixtureById(fixtureId: string): Promise<void> {
        if (!this.isFixtureId(fixtureId)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`Unsupported E2E fixture id: ${fixtureId}`);
        }

        const fixtureFile = this.getFixtureFile(fixtureId);

        if (!fixtureFile.exists) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`E2E fixture file not found: ${fixtureFile.name}`);
        }

        await databaseImportService.replaceFromUri(fixtureFile.uri);
    }

    private getFixtureFile(fixtureId: E2EFixtureId) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        return new File(Paths.document, 'E2EFixtures', E2E_FIXTURE_FILE_MAP[fixtureId]);
    }

    private isFixtureId(value: string): value is E2EFixtureId {
        return Object.hasOwn(E2E_FIXTURE_FILE_MAP, value);
    }
}

export const appE2EFixtureImportService = new AppE2EFixtureImportService();
