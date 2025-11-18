import { IntlShape, createIntl } from '@formatjs/intl';
import { createContext, useContext } from 'react';

import { DEFAULT_LOCALE } from '../constant/default-locale.constant';

export interface I18nContextInterface {
    intl: IntlShape;
}

export const I18nContext = createContext<I18nContextInterface>({
    intl: createIntl({ locale: DEFAULT_LOCALE.languageTag }),
});

export const useI18nContext = () => useContext(I18nContext);
