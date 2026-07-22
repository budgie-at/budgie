import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { AccountTypeEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it, vi } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { buildMonobank, fetchCanonicalsOfType, fetchExpenseEntries, monobankStub, seed, setupMonobankFixture } from '../../harness';

describe('consolidation/monobank-immediate-reconciliation', () => {
    it('reconciles an ATM withdrawal before entering its rate-limit wait', async () => {
        const { account: bankAccount } = setupMonobankFixture();
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: bankAccount.instrumentId });
        let releaseRateLimitWait: () => void = emptyFn;
        const waitForQueuedUserWorkSpy = vi.spyOn(syncWorkloadService, 'waitForQueuedUserWork');
        let syncPromise: Promise<unknown> = Promise.resolve();

        try {
            const rateLimitWaitEntered = new Promise<void>(resolve => {
                waitForQueuedUserWorkSpy.mockImplementation(async () => {
                    resolve();

                    return new Promise<boolean>(resolveRateLimitWait => {
                        releaseRateLimitWait = () => {
                            resolveRateLimitWait(false);
                        };
                    });
                });
            });

            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'privacy-safe-atm-001',
                    amount: -40800,
                    commissionRate: -800,
                    hold: false,
                    mcc: 6011,
                    operationAmount: -40800,
                    time: Math.floor(new Date('2026-01-15T12:00:00.000Z').getTime() / 1000)
                })
            ]);

            syncPromise = monobankSyncService.sync();
            await Promise.race([
                rateLimitWaitEntered,
                syncPromise.then(() => {
                    throw new Error('Monobank sync completed before entering its rate-limit wait');
                })
            ]);

            const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

            expect(canonicals).toHaveLength(1);
            const [canonical] = canonicals;
            if (!isDefined(canonical)) {
                return;
            }

            expect(canonical.fromAccountId).toBe(bankAccount.id);
            expect(canonical.toAccountId).toBe(cashAccount.id);
            expect((await fetchExpenseEntries(canonical.id)).find(entry => entry.type === TransactionEntryTypeEnum.FEE)?.amount).toBe(
                8000000
            );
        } finally {
            releaseRateLimitWait();
            try {
                await syncPromise;
            } finally {
                waitForQueuedUserWorkSpy.mockRestore();
            }
        }
    });
});
