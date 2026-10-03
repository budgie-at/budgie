import { ExchangeRatesService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';

import type { ConvertedAmountInterface } from '../interface/converted-amount.interface';

const convertedAmountAtom = Atom.family(
    ([fromInstrumentId, toInstrumentId, amountInMicroUnits]: readonly [number, number, number, Date | null | undefined]) =>
        appAtomRuntime.atom(
            fromInstrumentId === toInstrumentId
                ? Effect.succeed(null)
                : Effect.flatMap(ExchangeRatesService, exchangeRatesService =>
                      exchangeRatesService.convertStrict(fromInstrumentId, toInstrumentId, amountInMicroUnits)
                  )
        )
);

export const useConvertedAmount = (
    fromInstrumentId: number,
    toInstrumentId: number,
    amountInMicroUnits: number
): ConvertedAmountInterface | null => {
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const result = useAtomValue(convertedAmountAtom([fromInstrumentId, toInstrumentId, amountInMicroUnits, exchangeRatesUpdatedAt]));

    return AsyncResult.isSuccess(result) ? result.value : null;
};
