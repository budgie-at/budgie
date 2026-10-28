import { AccountEntityTable, InstrumentEntityTable, SettingsEntityTable, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';

import { DEFAULT_INSTRUMENT } from './default-instrument.constant';
import { DEFAULT_SETTINGS } from './default-settings.constant';

export const settingsResultAtom = databaseQueryAtom(
    [SettingsEntityTable],
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.find())
);

export const defaultInstrumentResultAtom = databaseQueryAtom(
    [SettingsEntityTable, InstrumentEntityTable],
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.findDefaultInstrument())
);

export const defaultAccountResultAtom = databaseQueryAtom(
    [SettingsEntityTable, AccountEntityTable],
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.findDefaultAccount())
);

export const isSettingsLoadingAtom = Atom.make(
    get =>
        AsyncResult.isInitial(get(settingsResultAtom)) ||
        AsyncResult.isInitial(get(defaultInstrumentResultAtom)) ||
        AsyncResult.isInitial(get(defaultAccountResultAtom))
);

export const settingsAtom = Atom.map(settingsResultAtom, result => AsyncResult.getOrElse(result, () => null) ?? DEFAULT_SETTINGS).pipe(
    Atom.withEquality(Equal.equals)
);

export const decimalPlacesAtom = Atom.map(settingsAtom, settings => (settings.showCents ? DEFAULT_DECIMAL_PLACES : 0));

export const defaultInstrumentAtom = Atom.map(
    defaultInstrumentResultAtom,
    result => AsyncResult.getOrElse(result, () => null) ?? DEFAULT_INSTRUMENT
).pipe(Atom.withEquality(Equal.equals));

export const defaultAccountAtom = Atom.map(defaultAccountResultAtom, result => AsyncResult.getOrElse(result, () => null)).pipe(
    Atom.withEquality(Equal.equals)
);

export const defaultInstrumentIdAtom = Atom.map(defaultInstrumentAtom, instrument => instrument.id);
