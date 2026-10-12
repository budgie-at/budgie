import { ExchangeRatesSyncService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';

export class ExchangeRateBackgroundService extends Context.Service<ExchangeRateBackgroundService>()(
    '@budgie/app/ExchangeRateBackgroundService',
    {
        make: Effect.gen(function* () {
            const exchangeRatesSyncService = yield* ExchangeRatesSyncService;
            const isE2EApp = Constants.expoConfig?.extra?.['appVariant'] === 'e2e';

            return {
                registerBackgroundTask: Effect.fn('ExchangeRateBackgroundService.registerBackgroundTask')(function* () {
                    if (isE2EApp || (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK)))) {
                        return;
                    }

                    yield* Effect.promise(() => BackgroundTask.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, { minimumInterval: 60 }));
                }),
                sync: () => (isE2EApp ? Effect.void : exchangeRatesSyncService.sync())
            };
        })
    }
) {
    static readonly layer = Layer.effect(ExchangeRateBackgroundService, ExchangeRateBackgroundService.make).pipe(
        Layer.provide(ExchangeRatesSyncService.layer)
    );
}
