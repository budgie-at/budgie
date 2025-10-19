import { Appearance } from 'react-native';

import { i18nGetOSLocale } from '../../@generic/utils/i18n.util';

import type { Languages } from '../constant/languages.constant';

export interface SettingsState {
    hasVibration: boolean;
    language: (typeof Languages)[number];
    isDarkColorSchema: boolean;
}

export const initialSettingsState: SettingsState = {
    hasVibration: true,
    language: i18nGetOSLocale(),
    isDarkColorSchema: Appearance.getColorScheme() === 'dark'
};
