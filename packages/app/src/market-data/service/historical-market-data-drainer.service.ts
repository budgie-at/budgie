import { AccountRepository } from '@budgie/contracts';
import { HistoricalMarketDataService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import type { AccountEntityInterface } from '@budgie/contracts';

export class HistoricalMarketDataDrainerService extends Context.Service<HistoricalMarketDataDrainerService>()(
    '@budgie/app/HistoricalMarketDataDrainerService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const accountRepository = yield* AccountRepository;
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const drainDelayMs = 500;
            const drainKey = 'historical-market-data';

            const drainNextJob = Effect.fn('HistoricalMarketDataDrainerService.drainNextJob')(function* () {
                const job = yield* workload.run(historicalMarketDataService.claimNextJob());

                if (!isDefined(job)) {
                    return false;
                }

                yield* historicalMarketDataService.fetchJobData(job).pipe(
                    Effect.tap(result =>
                        isNotEmptyArray(result.unsupportedCurrencyCodes)
                            ? Effect.logWarning('Historical fiat rates unavailable', result.unsupportedCurrencyCodes)
                            : Effect.void
                    ),
                    Effect.flatMap(result => workload.run(historicalMarketDataService.storeJobData(job, result))),
                    Effect.catchCause(cause => workload.run(historicalMarketDataService.failJob(job, cause)))
                );

                return true;
            });

            const scheduleDrain = Effect.fn('HistoricalMarketDataDrainerService.scheduleDrain')(function* () {
                yield* workload.schedule(
                    drainKey,
                    Effect.sleep(drainDelayMs).pipe(
                        Effect.andThen(waitForIdle),
                        Effect.andThen(drainNextJob()),
                        Effect.repeat({ while: shouldContinue => shouldContinue }),
                        Effect.catch(Effect.logError)
                    )
                );
            });

            const enqueueAccounts = (accounts: AccountEntityInterface[]) =>
                historicalMarketDataService.enqueueAccounts(accounts).pipe(Effect.ensuring(scheduleDrain()));

            return {
                enqueueAccounts,
                scheduleDrain,
                enqueueActiveAccounts: Effect.fn('HistoricalMarketDataDrainerService.enqueueActiveAccounts')(function* () {
                    yield* enqueueAccounts(yield* accountRepository.getAllActiveAccounts());
                }),
                cancelScheduledDrain: () => workload.cancelScheduled(drainKey)
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalMarketDataDrainerService, HistoricalMarketDataDrainerService.make).pipe(
        Layer.provide([Workload.layer, AccountRepository.layer, HistoricalMarketDataService.layer])
    );
}
