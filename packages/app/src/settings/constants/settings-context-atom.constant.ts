import { AccountEntityTable, CurrencyEnum, InstrumentEntityTable, SettingsEntityTable, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';

import { DEFAULT_INSTRUMENT } from './default-instrument.constant';
import { DEFAULT_SETTINGS } from './default-settings.constant';

const settingsAtom = databaseQueryAtom(
    [SettingsEntityTable, InstrumentEntityTable, AccountEntityTable],
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.findSettings())
);

export const settingsContextAtom = Atom.map(settingsAtom, result => {
    const settings = AsyncResult.getOrElse(result, () => null);
    const defaultInstrument = settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;
    const showCents = settings?.showCents ?? DEFAULT_SETTINGS.showCents;

    return {
        defaultAccount: settings?.defaultAccount ?? null,
        defaultInstrument,
        isLoading: AsyncResult.isInitial(result),
        settings: settings ?? DEFAULT_SETTINGS,
        decimalPlaces: showCents ? DEFAULT_DECIMAL_PLACES : 0,
        defaultCurrency: isEnumValue(defaultInstrument.code, CurrencyEnum) ? defaultInstrument.code : CurrencyEnum.USD
    };
}).pipe(Atom.withEquality(Equal.equals));
