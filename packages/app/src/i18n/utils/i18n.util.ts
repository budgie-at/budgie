import { LanguageEnum } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import * as Effect from 'effect/Effect';
import { getLocales } from 'expo-localization';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';
import { messages as enMessages } from '../locales/en/messages';

import type { Messages } from '@lingui/core';

const languageCatalogLoaders: Record<LanguageEnum, () => Promise<{ readonly messages: Messages }>> = {
    [LanguageEnum.EN]: () => import('../locales/en/messages'),
    [LanguageEnum.FR]: () => import('../locales/fr/messages'),
    [LanguageEnum.UK]: () => import('../locales/uk/messages'),
    [LanguageEnum.DE]: () => import('../locales/de/messages'),
    [LanguageEnum.ES]: () => import('../locales/es/messages')
};

i18n.load(LanguageEnum.EN, enMessages);
i18n.activate(LanguageEnum.EN);

export const i18nLoadLanguageMessages = (language: LanguageEnum) =>
    Effect.tryPromise({ try: languageCatalogLoaders[language], catch: cause => new NativeCallError({ cause }) }).pipe(
        Effect.map(catalogModule => catalogModule.messages)
    );

export const i18nEnsureLanguageActivated = Effect.fn('i18n.ensureLanguageActivated')(function* (language: LanguageEnum) {
    i18n.load(language, yield* i18nLoadLanguageMessages(language));
    i18n.activate(language);
});

export const i18nActivateFallback = (): void => {
    i18n.activate(LanguageEnum.EN);
};

export const i18nGetOSLocale = (): LanguageEnum => {
    const locales = getLocales();

    for (const locale of locales) {
        const languageCode = locale.languageCode?.toLowerCase();

        if (isEnumValue(languageCode, LanguageEnum)) {
            return languageCode;
        }
    }

    return LanguageEnum.EN;
};
