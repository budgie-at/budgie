import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import { ReactNode, useEffect } from 'react';

import { useSettingsContext } from '../../settings/context/settings.context';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';

interface Props {
    readonly children: ReactNode;
}

export const I18nProvider = ({ children }: Props) => {
    const { settings } = useSettingsContext();

    useEffect(() => {
        i18n.activate(settings.language);
    }, [settings.language]);

    const cache = createIntlCache();
    const intl = createIntl({ locale: settings.locale }, cache);

    const value: I18nContextInterface = { intl };

    return (
        <I18nContext.Provider value={value}>
            <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
        </I18nContext.Provider>
    );
};
