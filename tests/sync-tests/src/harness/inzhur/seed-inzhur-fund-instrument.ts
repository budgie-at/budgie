import { InstrumentPriceProviderEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const seedInzhurFundInstrument = Effect.fnUntraced(function* (code: string, name: string) {
    const instrumentRepository = yield* InstrumentRepository;

    return yield* instrumentRepository.create({
        type: InstrumentTypeEnum.FUND,
        code,
        name,
        symbol: name.split(' ').at(-1) ?? code,
        priceProvider: InstrumentPriceProviderEnum.INZHUR,
        providerInstrumentId: code
    });
});
