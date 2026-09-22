import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from 'vitest';

import { LaterDebtTransferMigrationScenario } from './later-debt-transfer-migration.scenario';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const fixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/post-0035-later-borrowed-transfer.db');

describe('later debt transfer migration', () => {
    it('moves a principal transfer created after migration 0035 onto its funding account', async () => {
        await new LaterDebtTransferMigrationScenario(fixturePath).run();
    });
});
