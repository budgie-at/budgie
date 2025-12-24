import { getLocales } from 'expo-localization';

import { isDefined } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { DEFAULT_LOCALE } from '../constant/default-locale.constant';
import { LOCALES } from '../constant/locales.constant';
import { LocaleInfoInterface } from '../interface/locale-info.interface';

export const useLocaleInfo = (): LocaleInfoInterface => {
    const settingsLocale = useSetting('locale');
    const [locale] = getLocales();

    const localeFromSettings = LOCALES.find(({ languageTag }) => languageTag === settingsLocale);

    if (isDefined(localeFromSettings)) {
        return localeFromSettings;
    }

    const localeFromSystem = LOCALES.find(({ languageTag }) => languageTag === locale.languageTag);

    if (isDefined(localeFromSystem)) {
        return localeFromSystem;
    }

    return DEFAULT_LOCALE;
};
