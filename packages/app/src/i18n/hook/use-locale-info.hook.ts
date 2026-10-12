import { useSetting } from '../../settings/hook/use-setting.hook';
import { languageToLocale } from '../util/language-to-locale.util';

import type { LocaleInfoInterface } from '../interface/locale-info.interface';

const SAMPLE_NUMBER = 10000.1;

export const useLocaleInfo = (): LocaleInfoInterface => {
    const languageTag = languageToLocale(useSetting('language'));
    const parts = new Intl.NumberFormat(languageTag).formatToParts(SAMPLE_NUMBER);

    return {
        languageTag,
        languageCode: languageTag.split('-')[0],
        decimalSeparator: parts.find(({ type }) => type === 'decimal')?.value ?? '.',
        digitGroupingSeparator: parts.find(({ type }) => type === 'group')?.value ?? ','
    };
};
