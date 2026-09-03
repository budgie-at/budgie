import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import { ReactNode, useEffect, useState } from 'react';

import { useSettingsContext } from '../../settings/context/settings.context';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';
import { i18nEnsureLanguageActivated, i18nGetOSLocale } from '../util/i18n.util';
import { languageToLocale } from '../util/language-to-locale.util';

interface Props {
    readonly children: ReactNode;
}

const intlCache = createIntlCache();

export const I18nProvider = ({ children }: Props) => {
    const { settings, isLoading: isSettingsLoading } = useSettingsContext();
    const { language } = settings;
    const locale = languageToLocale(language);
    const [isLanguageActivated, setIsLanguageActivated] = useState(false);

    useEffect(() => {
        let isSubscribed = true;
        const targetLanguage = isSettingsLoading ? i18nGetOSLocale() : language;

        const handleActivationSettled = () => {
            if (isSubscribed) {
                setIsLanguageActivated(true);
            }
        };

        void i18nEnsureLanguageActivated(targetLanguage).then(handleActivationSettled, handleActivationSettled);

        return () => {
            isSubscribed = false;
        };
    }, [isSettingsLoading, language]);

    const intl = createIntl({ locale }, intlCache);

    const value: I18nContextInterface = { intl };

    if (!isLanguageActivated) {
        return null;
    }

    return (
        <I18nContext.Provider value={value}>
            <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
        </I18nContext.Provider>
    );
};
