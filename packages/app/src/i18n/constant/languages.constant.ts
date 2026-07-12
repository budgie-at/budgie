import { LanguageEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { LanguageInterface } from '../interface/language.interface';

const DEFAULT_LANGUAGE: LanguageInterface = {
    code: LanguageEnum.EN,
    name: msg`English`
};

export const LANGUAGES: LanguageInterface[] = [
    DEFAULT_LANGUAGE,
    {
        code: LanguageEnum.FR,
        name: msg`French`
    },
    {
        code: LanguageEnum.UK,
        name: msg`Ukrainian`
    },
    {
        code: LanguageEnum.DE,
        name: msg`German`
    },
    {
        code: LanguageEnum.ES,
        name: msg`Spanish`
    }
];
