import { LanguageEnum } from '@budgie/contracts';
import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as Effect from 'effect/Effect';
import { ReactNode, useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSettingsContext } from '../../settings/context/settings.context';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';
import { i18nActivateFallback, i18nEnsureLanguageActivated, i18nGetOSLocale } from '../util/i18n.util';
import { languageToLocale } from '../util/language-to-locale.util';

interface Props {
    readonly children: ReactNode;
}

const intlCache = createIntlCache();

export const I18nProvider = ({ children }: Props) => {
    const { settings, isLoading: isSettingsLoading } = useSettingsContext();
    const { language } = settings;
    const [activatedLanguage, setActivatedLanguage] = useState<LanguageEnum | null>(null);

    useEffect(() => {
        const targetLanguage = isSettingsLoading ? i18nGetOSLocale() : language;
        const fiber = appRuntime.runFork(
            i18nEnsureLanguageActivated(targetLanguage).pipe(
                Effect.match({
                    onSuccess: () => {
                        setActivatedLanguage(targetLanguage);
                    },
                    onFailure: () => {
                        i18nActivateFallback();
                        setActivatedLanguage(LanguageEnum.EN);
                    }
                })
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [isSettingsLoading, language]);

    const locale = languageToLocale(isDefined(activatedLanguage) ? activatedLanguage : language);

    const intl = createIntl({ locale }, intlCache);

    const value: I18nContextInterface = { intl };

    if (!isDefined(activatedLanguage)) {
        return null;
    }

    return (
        <I18nContext.Provider value={value}>
            <LinguiProvider i18n={i18n}>{children}</LinguiProvider>
        </I18nContext.Provider>
    );
};
