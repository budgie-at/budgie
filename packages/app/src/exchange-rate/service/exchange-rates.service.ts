import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { exchangeRateRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';

class ExchangeRatesService {
    readonly convert = Effect.fn('ExchangeRatesService.convert')(function* (
        this: ExchangeRatesService,
        fromInstrumentId: number,
        toInstrumentId: number,
        fromAmountInMicroUnits: number
    ) {
        if (fromInstrumentId === toInstrumentId) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        const exchangeRate = yield* Db.query(() => exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId));

        if (isDefined(exchangeRate)) {
            return { amount: Math.round(fromAmountInMicroUnits / exchangeRate.rate), exchangeRate: exchangeRate.rate };
        }

        const baseInstrument = yield* this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        const [baseFromExchangeRate, baseToExchangeRate] = yield* Effect.all(
            [
                Db.query(() => exchangeRateRepository.findByBaseAndQuoteIds(baseInstrument.id, fromInstrumentId)),
                Db.query(() => exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, baseInstrument.id))
            ],
            { concurrency: 'unbounded' }
        );

        if (!isDefined(baseFromExchangeRate) || !isDefined(baseToExchangeRate)) {
            return { amount: fromAmountInMicroUnits, exchangeRate: 1 };
        }

        return {
            amount: Math.round(fromAmountInMicroUnits / baseFromExchangeRate.rate / baseToExchangeRate.rate),
            exchangeRate: baseToExchangeRate.rate
        };
    });

    readonly convertStrict = Effect.fn('ExchangeRatesService.convertStrict')(function* (
        this: ExchangeRatesService,
        fromInstrumentId: number,
        toInstrumentId: number,
        fromAmountInMicroUnits: number
    ) {
        const exchangeRate = yield* this.findCurrentConversionRate(fromInstrumentId, toInstrumentId);

        if (!isDefined(exchangeRate)) {
            return null;
        }

        return {
            amount: Math.round(fromAmountInMicroUnits * exchangeRate),
            exchangeRate
        };
    });

    readonly getBaseInstrument = Effect.fn('ExchangeRatesService.getBaseInstrument')(function* () {
        const settings = yield* settingsRepository.getSettings();

        if (isPositiveNumber(settings.defaultInstrumentId)) {
            const instrumentId = settings.defaultInstrumentId;

            return yield* Db.query(() => instrumentRepository.findById(instrumentId));
        }

        return yield* instrumentRepository.findByCode('USD');
    });

    private readonly findCurrentConversionRate = Effect.fn('ExchangeRatesService.findCurrentConversionRate')(function* (
        this: ExchangeRatesService,
        fromInstrumentId: number,
        toInstrumentId: number
    ) {
        if (fromInstrumentId === toInstrumentId) {
            return 1;
        }

        const directExchangeRate = yield* this.findDirectOrInverseConversionRate(fromInstrumentId, toInstrumentId);

        if (isDefined(directExchangeRate)) {
            return directExchangeRate;
        }

        const baseInstrument = yield* this.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return null;
        }

        const [fromToBaseExchangeRate, baseToTargetExchangeRate] = yield* Effect.all(
            [
                this.findDirectOrInverseConversionRate(fromInstrumentId, baseInstrument.id),
                this.findDirectOrInverseConversionRate(baseInstrument.id, toInstrumentId)
            ],
            { concurrency: 'unbounded' }
        );

        if (!isDefined(fromToBaseExchangeRate) || !isDefined(baseToTargetExchangeRate)) {
            return null;
        }

        return fromToBaseExchangeRate * baseToTargetExchangeRate;
    });

    private readonly findDirectOrInverseConversionRate = Effect.fn('ExchangeRatesService.findDirectOrInverseConversionRate')(function* (
        fromInstrumentId: number,
        toInstrumentId: number
    ) {
        const directExchangeRate = yield* Db.query(() => exchangeRateRepository.findByBaseAndQuoteIds(fromInstrumentId, toInstrumentId));

        if (isDefined(directExchangeRate)) {
            return directExchangeRate.rate;
        }

        const inverseExchangeRate = yield* Db.query(() => exchangeRateRepository.findByBaseAndQuoteIds(toInstrumentId, fromInstrumentId));

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        return null;
    });
}

export const exchangeRatesService = new ExchangeRatesService();
