import { ExchangeRateEntityTable, InstrumentEntityTable, SettingsEntityTable } from '@budgie/contracts';
import { ExchangeRatesService } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { ConvertedAmountInterface } from '../interface/converted-amount.interface';

const noConvertedAmountAtom = Atom.make(AsyncResult.success(null));

const convertedAmountAtom = databaseQueryFamily(
    [ExchangeRateEntityTable, SettingsEntityTable, InstrumentEntityTable],
    ExchangeRatesService,
    (exchangeRatesService, [fromInstrumentId, toInstrumentId, amountInMicroUnits]: readonly [number, number, number]) =>
        exchangeRatesService.convertStrict(fromInstrumentId, toInstrumentId, amountInMicroUnits)
);

export const useConvertedAmount = (
    fromInstrumentId: number,
    toInstrumentId: number,
    amountInMicroUnits: number
): ConvertedAmountInterface | null => {
    const shouldQuery = isPositiveNumber(fromInstrumentId) && isPositiveNumber(toInstrumentId) && fromInstrumentId !== toInstrumentId;
    const result = useLiveAtomValue(
        shouldQuery ? convertedAmountAtom([fromInstrumentId, toInstrumentId, amountInMicroUnits]) : noConvertedAmountAtom
    );

    return AsyncResult.isSuccess(result) ? result.value : null;
};
