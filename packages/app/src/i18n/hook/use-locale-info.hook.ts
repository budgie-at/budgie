import { getLocales } from 'expo-localization';

import { isDefined } from '@rnw-community/shared';

import { useSettingsContext } from '../../settings/context/settings.context';
import { DEFAULT_LOCALE } from '../constant/default-locale.constant';
import { LOCALES } from '../constant/locales.constant';
import { LocaleInfoInterface } from '../interface/locale-info.interface';

export const useLocaleInfo = (): LocaleInfoInterface => {
    const { settings } = useSettingsContext();
    const [locale] = getLocales();

    const localeFromSettings = LOCALES.find(({ languageTag }) => languageTag === settings.locale);

    if (isDefined(localeFromSettings)) {
        return localeFromSettings;
    }

    const localeFromSystem = LOCALES.find(({ languageTag }) => languageTag === locale.languageTag);

    if (isDefined(localeFromSystem)) {
        return localeFromSystem;
    }

    return DEFAULT_LOCALE;
};
