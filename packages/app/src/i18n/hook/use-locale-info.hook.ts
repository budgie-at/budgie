import { LanguageEnum } from '@budgie/contracts';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { languageToLocale } from '../util/language-to-locale.util';

import type { LocaleInfoInterface } from '../interface/locale-info.interface';

const SEPARATORS_BY_LANGUAGE: Record<LanguageEnum, Pick<LocaleInfoInterface, 'decimalSeparator' | 'digitGroupingSeparator'>> = {
    [LanguageEnum.EN]: { decimalSeparator: '.', digitGroupingSeparator: ',' },
    [LanguageEnum.FR]: { decimalSeparator: ',', digitGroupingSeparator: ' ' },
    [LanguageEnum.UK]: { decimalSeparator: ',', digitGroupingSeparator: ' ' },
    [LanguageEnum.DE]: { decimalSeparator: ',', digitGroupingSeparator: '.' },
    [LanguageEnum.ES]: { decimalSeparator: ',', digitGroupingSeparator: '.' }
};

export const useLocaleInfo = (): LocaleInfoInterface => {
    const language = useSetting('language');
    const languageTag = languageToLocale(language);

    return {
        languageTag,
        languageCode: languageTag.split('-')[0],
        ...SEPARATORS_BY_LANGUAGE[language]
    };
};
