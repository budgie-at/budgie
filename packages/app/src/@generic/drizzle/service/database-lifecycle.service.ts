import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ruleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';
import { monobankSyncService } from '../../../sync/service/monobank-sync.service';
import { expoDb } from '../db/db';

class DatabaseLifecycleService {
    private closeInflight: Promise<void> | null = null;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async close(): Promise<void> {
        if (isDefined(this.closeInflight)) {
            await this.closeInflight;

            return;
        }
        this.closeInflight = this.runClose();
        try {
            await this.closeInflight;
        } finally {
            this.closeInflight = null;
        }
    }

    private async runClose(): Promise<void> {
        await this.drainInFlightWork();

        await expoDb.closeAsync();
        global.__expoSqliteDb__ = undefined; // eslint-disable-line no-undefined, no-underscore-dangle
        global.__drizzleDb__ = undefined; // eslint-disable-line no-undefined, no-underscore-dangle
    }

    private async drainInFlightWork(): Promise<void> {
        await Promise.all([monobankSyncService.whenIdle(), ruleApplicationDrainerService.whenIdle()]);
    }
}

export const databaseLifecycleService = new DatabaseLifecycleService();
