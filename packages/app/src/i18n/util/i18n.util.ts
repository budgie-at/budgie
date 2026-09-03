import { LanguageEnum } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { getLocales } from 'expo-localization';

import { isDefined } from '@rnw-community/shared';

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

const languageMessagesPromises = new Map<LanguageEnum, Promise<Messages>>();

let languageActivationRequestId = 0;

i18n.load(LanguageEnum.EN, enMessages);
i18n.activate(LanguageEnum.EN);

const loadLanguageMessages = (language: LanguageEnum): Promise<Messages> => {
    const existingPromise = languageMessagesPromises.get(language);

    if (isDefined(existingPromise)) {
        return existingPromise;
    }

    const messagesPromise = languageCatalogLoaders[language]().then(catalogModule => catalogModule.messages);

    languageMessagesPromises.set(language, messagesPromise);

    return messagesPromise;
};

export const i18nEnsureLanguageActivated = async (language: LanguageEnum): Promise<void> => {
    languageActivationRequestId += 1;
    const requestId = languageActivationRequestId;

    const messages = await loadLanguageMessages(language);

    i18n.load(language, messages);

    if (requestId === languageActivationRequestId) {
        i18n.activate(language);
    }
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
