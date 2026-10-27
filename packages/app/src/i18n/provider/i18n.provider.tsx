import { useAtomValue } from '@effect/atom-react/Hooks';
import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';

import { activatedLanguageAtom } from '../constant/activated-language-atom.constant';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';
import { languageToLocale } from '../utils/language-to-locale.util';

interface Props {
    readonly children: ReactNode;
}

const intlCache = createIntlCache();

export const I18nProvider = ({ children }: Props) => {
    const activatedLanguage = AsyncResult.getOrElse(useAtomValue(activatedLanguageAtom), () => null);

    if (!isDefined(activatedLanguage)) {
        return null;
    }

    const intl = createIntl({ locale: languageToLocale(activatedLanguage) }, intlCache);

    const value: I18nContextInterface = { intl };

    return (
        <I18nContext.Provider value={value}>
            <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
        </I18nContext.Provider>
    );
};
