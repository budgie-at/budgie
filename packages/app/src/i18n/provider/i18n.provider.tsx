import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import { ReactNode, useEffect } from 'react';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';

interface Props {
    readonly children: ReactNode;
}

export const I18nProvider = ({ children }: Props) => {
    const locale = useSetting('locale');
    const language = useSetting('language');

    useEffect(() => void i18n.activate(language), [language]);

    const cache = createIntlCache();
    const intl = createIntl({ locale }, cache);

    const value: I18nContextInterface = { intl };

    return (
        <I18nContext.Provider value={value}>
            <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
        </I18nContext.Provider>
    );
};
