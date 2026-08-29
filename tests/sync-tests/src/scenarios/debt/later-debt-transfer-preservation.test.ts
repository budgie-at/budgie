import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from 'vitest';

import { LaterDebtTransferPreservationScenario } from './later-debt-transfer-preservation.scenario';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const fixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/post-0035-later-borrowed-transfer.db');

describe('later debt transfer preservation', () => {
    it('preserves a principal transfer created after migration 0035', async () => {
        await new LaterDebtTransferPreservationScenario(fixturePath).run();
    });
});
