import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { buildMonobank, fetchCanonicalsOfType, fetchExpenseEntries, monobankStub, run, seed, setupMonobankFixture } from '../../harness';

describe('consolidation/monobank-immediate-reconciliation', () => {
    it('reconciles an ATM withdrawal before entering its rate-limit wait', async () => {
        const { account: bankAccount } = setupMonobankFixture();
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: bankAccount.instrumentId });
        const rateLimitWaitEntered = Deferred.makeUnsafe<void>();
        const releaseRateLimitWait = Deferred.makeUnsafe<void>();
        let syncPromise: Promise<unknown> = Promise.resolve();

        try {
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

            syncPromise = run(
                Effect.clockWith(clock =>
                    monobankSyncService.sync().pipe(
                        Effect.provideService(
                            Clock.Clock,
                            Object.assign(Object.create(clock), {
                                sleep: () =>
                                    Effect.andThen(Deferred.succeed(rateLimitWaitEntered, undefined), Deferred.await(releaseRateLimitWait))
                            })
                        )
                    )
                )
            );
            await Promise.race([
                run(Deferred.await(rateLimitWaitEntered)),
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
            Deferred.doneUnsafe(releaseRateLimitWait, Effect.void);
            await syncPromise;
        }
    });
});
