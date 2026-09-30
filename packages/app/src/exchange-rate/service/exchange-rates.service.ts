import { ExchangeRateRepository, InstrumentRepository, SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

export class ExchangeRatesService extends Context.Service<ExchangeRatesService>()('@budgie/app/ExchangeRatesService', {
    make: Effect.gen(function* () {
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const settingsRepository = yield* SettingsRepository;

        const getBaseInstrument = Effect.fn('ExchangeRatesService.getBaseInstrument')(function* () {
            const settings = yield* settingsRepository.getSettings();

            if (isPositiveNumber(settings.defaultInstrumentId)) {
                return yield* instrumentRepository.findById(settings.defaultInstrumentId);
            }

            return yield* instrumentRepository.findByCode('USD');
        });

        const findDirectOrInverseConversionRate = Effect.fn('ExchangeRatesService.findDirectOrInverseConversionRate')(function* (
            fromInstrumentId: number,
            toInstrumentId: number
        ) {
            const directExchangeRate = yield* exchangeRateRepository.findByBaseAndQuoteIds(fromInstrumentId, toInstrumentId);

            if (isDefined(directExchangeRate)) {
                return directExchangeRate.rate;
            }

            const inverseExchangeRate = yield* exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId);

            if (isDefined(inverseExchangeRate)) {
                return 1 / inverseExchangeRate.rate;
            }

            return null;
        });

        const findCurrentConversionRate = Effect.fn('ExchangeRatesService.findCurrentConversionRate')(function* (
            fromInstrumentId: number,
            toInstrumentId: number
        ) {
            if (fromInstrumentId === toInstrumentId) {
                return 1;
            }

            const directExchangeRate = yield* findDirectOrInverseConversionRate(fromInstrumentId, toInstrumentId);

            if (isDefined(directExchangeRate)) {
                return directExchangeRate;
            }

            const baseInstrument = yield* getBaseInstrument();

            if (!isDefined(baseInstrument)) {
                return null;
            }

            const [fromToBaseExchangeRate, baseToTargetExchangeRate] = yield* Effect.all(
                [
                    findDirectOrInverseConversionRate(fromInstrumentId, baseInstrument.id),
                    findDirectOrInverseConversionRate(baseInstrument.id, toInstrumentId)
                ],
                { concurrency: 'unbounded' }
            );

            if (!isDefined(fromToBaseExchangeRate) || !isDefined(baseToTargetExchangeRate)) {
                return null;
            }

            return fromToBaseExchangeRate * baseToTargetExchangeRate;
        });

        return {
            getBaseInstrument,
            convert: Effect.fn('ExchangeRatesService.convert')(function* (
                fromInstrumentId: number,
                toInstrumentId: number,
                fromAmountInMicroUnits: number
            ) {
                const exchangeRate = yield* findCurrentConversionRate(toInstrumentId, fromInstrumentId);

                if (!isDefined(exchangeRate)) {
                    return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
                }

                return { amount: Math.round(fromAmountInMicroUnits / exchangeRate), exchangeRate };
            }),
            convertStrict: Effect.fn('ExchangeRatesService.convertStrict')(function* (
                fromInstrumentId: number,
                toInstrumentId: number,
                fromAmountInMicroUnits: number
            ) {
                const exchangeRate = yield* findCurrentConversionRate(fromInstrumentId, toInstrumentId);

                if (!isDefined(exchangeRate)) {
                    return null;
                }

                return {
                    amount: Math.round(fromAmountInMicroUnits * exchangeRate),
                    exchangeRate
                };
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ExchangeRatesService, ExchangeRatesService.make).pipe(
        Layer.provide([ExchangeRateRepository.layer, InstrumentRepository.layer, SettingsRepository.layer])
    );
}
