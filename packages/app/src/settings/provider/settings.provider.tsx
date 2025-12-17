import { CurrencyEnum } from '@budgie/contracts';
import { ReactNode } from 'react';

import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { DEFAULT_INSTRUMENT } from '../constants/default-instrument.constant';
import { DEFAULT_SETTINGS } from '../constants/default-settings.constant';
import { SettingsContext } from '../context/settings.context';
import { useGetSettingsQuery } from '../query/use-get-settings.query';

interface Props {
    readonly children: ReactNode;
}

export const SettingsProvider = ({ children }: Props) => {
    const result = useGetSettingsQuery();

    const showCents = result.settings?.showCents ?? DEFAULT_SETTINGS.showCents;

    const defaultAccount = result.settings?.defaultAccount ?? null;
    const defaultInstrument = result.settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;

    const value = {
        defaultAccount,
        defaultInstrument,
        isLoading: result.isLoading,
        settings: result.settings ?? DEFAULT_SETTINGS,
        decimalPlaces: showCents ? DEFAULT_DECIMAL_PLACES : 0,
        defaultCurrency: isEnumValue(defaultInstrument.code, CurrencyEnum) ? defaultInstrument.code : CurrencyEnum.USD
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
