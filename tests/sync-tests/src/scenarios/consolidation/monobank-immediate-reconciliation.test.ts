import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import { buildMonobank, fetchCanonicalsOfType, monobankStub, seed, setupMonobankFixture, TestLayer } from '../../harness';

describe('consolidation/monobank-immediate-reconciliation', () => {
    it.effect('keeps a synced ATM withdrawal as a bank expense through immediate reconciliation and after sync', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { account: bankAccount } = setupMonobankFixture();
            seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: bankAccount.instrumentId });
            const rateLimitWaitEntered = yield* Deferred.make<void>();
            const releaseRateLimitWait = yield* Deferred.make<void>();

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

            const syncFiber = yield* Effect.forkChild(
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

            yield* Effect.raceFirst(
                Deferred.await(rateLimitWaitEntered),
                Fiber.join(syncFiber).pipe(
                    Effect.andThen(Effect.die(new Error('Monobank sync completed before entering its rate-limit wait')))
                )
            ).pipe(
                Effect.tap(() =>
                    Effect.sync(() => {
                        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
                    })
                ),
                Effect.ensuring(Deferred.succeed(releaseRateLimitWait, undefined))
            );
            yield* Fiber.join(syncFiber);

            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
