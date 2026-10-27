import { LanguageEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { createIntl, createIntlCache } from '@formatjs/intl';
import { i18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as Effect from 'effect/Effect';
import { ReactNode, useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { isSettingsLoadingAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { I18nContext, I18nContextInterface } from '../context/i18n.context';
import { i18nActivateFallback, i18nEnsureLanguageActivated, i18nGetOSLocale } from '../utils/i18n.util';
import { languageToLocale } from '../utils/language-to-locale.util';

interface Props {
    readonly children: ReactNode;
}

const intlCache = createIntlCache();

export const I18nProvider = ({ children }: Props) => {
    const isSettingsLoading = useAtomValue(isSettingsLoadingAtom);
    const language = useSetting('language');
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
