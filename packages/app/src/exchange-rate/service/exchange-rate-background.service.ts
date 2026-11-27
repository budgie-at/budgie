import { ExchangeRatesSyncService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import Constants from 'expo-constants';

export class ExchangeRateBackgroundService extends Context.Service<ExchangeRateBackgroundService>()(
    '@budgie/app/ExchangeRateBackgroundService',
    {
        make: Effect.gen(function* () {
            const exchangeRatesSyncService = yield* ExchangeRatesSyncService;
            const isE2EApp = Constants.expoConfig?.extra?.['appVariant'] === 'e2e';

            return {
                sync: isE2EApp ? Effect.void : exchangeRatesSyncService.sync()
            };
        })
    }
) {
    static readonly layer = Layer.effect(ExchangeRateBackgroundService, ExchangeRateBackgroundService.make).pipe(
        Layer.provide(ExchangeRatesSyncService.layer)
    );
}
