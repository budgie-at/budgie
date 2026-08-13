import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { MONOBANK_MAX_PERIOD_SECONDS } from '@budgie/bank-sync';
import { AccountTypeEnum, BankSyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchBankSyncById, fetchPersistedMonobankTransactions, seed } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const MS_PER_SECOND = 1_000;
const SECONDS_PER_DAY = 86_400;
const STALE_GAP_DAYS = 90;
const FRESH_GAP_DAYS = 5;
const EXPECTED_STALE_CHUNK_COUNT = 3;

interface RequestedWindowInterface {
    readonly from: number;
    readonly to: number;
}

const stubStatementCapturingWindows = (): RequestedWindowInterface[] => {
    const requestedWindows: RequestedWindowInterface[] = [];
    monobankServer.use(
        http.get(STATEMENT_ENDPOINT, ({ params }) => {
            const from = Number(params['from']);
            const to = Number(params['to']);
            requestedWindows.push({ from, to });

            const transaction = buildMonobank.transaction({
                id: `tx-chunk-${requestedWindows.length}`,
                amount: -100,
                hold: false,
                time: to - 1
            });

            return HttpResponse.json([transaction]);
        })
    );

    return requestedWindows;
};

const expectWindowsAreBoundedAndContiguous = (windows: RequestedWindowInterface[]): void => {
    for (const window of windows) {
        expect(window.to - window.from).toBeLessThanOrEqual(MONOBANK_MAX_PERIOD_SECONDS);
    }
    for (const [index, window] of windows.entries()) {
        if (index > 0) {
            expect(window.from).toBe(windows[index - 1]?.to);
        }
    }
};

const expectForwardSyncCompleted = (bankSyncId: number, expectedTransactionCount: number): void => {
    const finalSync = fetchBankSyncById(bankSyncId);
    expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
    expect(finalSync.forwardSyncedAt).not.toBeNull();
    expect(finalSync.transactionCount).toBe(expectedTransactionCount);
};

describe('monobank/forward-sync-window-clamp', () => {
    it('bounds each forward statement request to maxPeriodSeconds and advances the cursor chunk by chunk to now for a stale window', async () => {
        const now = new Date();
        const staleForwardSyncFromAt = new Date(now.getTime() - STALE_GAP_DAYS * SECONDS_PER_DAY * MS_PER_SECOND);
        const account = seed.account({ externalId: 'mono-acc-stale', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const bankSync = seed.bankSync({
            accountId: account.id,
            mode: BankSyncModeEnum.FORWARD,
            forwardSyncFromAt: staleForwardSyncFromAt
        });
        const requestedWindows = stubStatementCapturingWindows();

        await monobankSyncService.sync();

        expect(requestedWindows).toHaveLength(EXPECTED_STALE_CHUNK_COUNT);
        expectWindowsAreBoundedAndContiguous(requestedWindows);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(EXPECTED_STALE_CHUNK_COUNT);
        expectForwardSyncCompleted(bankSync.id, EXPECTED_STALE_CHUNK_COUNT);
    });

    it('issues a single statement request and completes immediately for a fresh forwardSyncFromAt', async () => {
        const now = new Date();
        const freshForwardSyncFromAt = new Date(now.getTime() - FRESH_GAP_DAYS * SECONDS_PER_DAY * MS_PER_SECOND);
        const account = seed.account({ externalId: 'mono-acc-fresh', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const bankSync = seed.bankSync({
            accountId: account.id,
            mode: BankSyncModeEnum.FORWARD,
            forwardSyncFromAt: freshForwardSyncFromAt
        });
        let requestCount = 0;
        monobankServer.use(
            http.get(STATEMENT_ENDPOINT, () => {
                requestCount += 1;

                return HttpResponse.json([buildMonobank.transaction({ id: 'tx-fresh-1', amount: -50, hold: false })]);
            })
        );

        await monobankSyncService.sync();

        expect(requestCount).toBe(1);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(1);
        expectForwardSyncCompleted(bankSync.id, 1);
    });
});
