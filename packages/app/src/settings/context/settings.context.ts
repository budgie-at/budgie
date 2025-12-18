import { AccountEntityInterface, CurrencyEnum, InstrumentEntityInterface, SettingsEntityInterface } from '@budgie/contracts';
import { createContext, use } from 'react';

import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { DEFAULT_INSTRUMENT } from '../constants/default-instrument.constant';
import { DEFAULT_SETTINGS } from '../constants/default-settings.constant';

interface SettingsContextInterface {
    defaultInstrument: InstrumentEntityInterface;
    defaultAccount: AccountEntityInterface | null;
    settings: SettingsEntityInterface;
    defaultCurrency: CurrencyEnum;
    decimalPlaces: number;
    isLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextInterface>({
    settings: DEFAULT_SETTINGS,
    defaultCurrency: CurrencyEnum.USD,
    defaultInstrument: DEFAULT_INSTRUMENT,
    decimalPlaces: DEFAULT_DECIMAL_PLACES,
    defaultAccount: null,
    isLoading: true
});

export const useSettingsContext = () => use(SettingsContext);
