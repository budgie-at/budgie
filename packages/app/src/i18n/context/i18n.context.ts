import { LanguageEnum } from '@budgie/contracts';
import { IntlShape, createIntl } from '@formatjs/intl';
import { createContext, use } from 'react';

import { languageToLocale } from '../utils/language-to-locale.util';

export interface I18nContextInterface {
    intl: IntlShape;
}

export const I18nContext = createContext<I18nContextInterface>({
    intl: createIntl({ locale: languageToLocale(LanguageEnum.EN) })
});

export const useI18nContext = () => use(I18nContext);
