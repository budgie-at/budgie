import { getLocales } from 'expo-localization';

import { isDefined } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { DEFAULT_LOCALE } from '../constant/default-locale.constant';
import { LOCALES } from '../constant/locales.constant';
import { LocaleInfoInterface } from '../interface/locale-info.interface';
import { languageToLocale } from '../util/language-to-locale.util';

export const useLocaleInfo = (): LocaleInfoInterface => {
    const language = useSetting('language');
    const [locale] = getLocales();

    const localeTag = languageToLocale(language);
    const localeFromSettings = LOCALES.find(({ languageTag }) => languageTag === localeTag);

    if (isDefined(localeFromSettings)) {
        return localeFromSettings;
    }

    const localeFromSystem = LOCALES.find(({ languageTag }) => languageTag === locale.languageTag);

    if (isDefined(localeFromSystem)) {
        return localeFromSystem;
    }

    return DEFAULT_LOCALE;
};
