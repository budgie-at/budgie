import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchCanonicalsOfType, monobankStub, run, seed, setupMonobankFixture } from '../../harness';

describe('consolidation/monobank-immediate-reconciliation', () => {
    it('keeps a synced ATM withdrawal as a bank expense through immediate reconciliation and after sync', async () => {
        const { account: bankAccount } = setupMonobankFixture();
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: bankAccount.instrumentId });
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
                    time: Math.floor(Date.now() / 1000) - 60 * 60
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

            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
        } finally {
            Deferred.doneUnsafe(releaseRateLimitWait, Effect.void);
            await syncPromise;
        }

        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
    });
});
