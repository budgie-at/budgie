import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { AccountTypeEnum, BankSyncModeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

import { seed } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const staleForwardSyncFromAt = new Date(2026, 0, 1);

describe('monobank/queued-work-yield', () => {
    it('yields after the current forward sync when user work is queued', async () => {
        const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
        const events: string[] = [];
        let queuedImport: Promise<void> | null = null;

        for (const externalId of externalIds) {
            const account = seed.account({ externalId, externalSource: ExternalSourceEnum.MONOBANK, type: AccountTypeEnum.BANK_SYNC });
            seed.bankSync({
                accountId: account.id,
                forwardSyncFromAt: staleForwardSyncFromAt,
                mode: BankSyncModeEnum.FORWARD,
                provider: ExternalSourceEnum.MONOBANK
            });
        }

        monobankServer.use(
            http.get(statementEndpoint, ({ params }) => {
                events.push(`request:${String(params['account'])}`);

                if (queuedImport === null) {
                    queuedImport = syncWorkloadService.run('file-import', async () => {
                        events.push('file-import');
                    });
                }

                return HttpResponse.json([]);
            })
        );

        await syncWorkloadService.run('startup', () => monobankSyncService.sync());
        await queuedImport;

        expect(events).toEqual(['request:mono-acc-1', 'file-import']);
    });
});
