import { LanguageEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { LanguageInterface } from '../interface/language-interface.type';

const DEFAULT_LANGUAGE: LanguageInterface = {
    code: LanguageEnum.EN,
    name: msg`English`,
    emoji: '🇺🇸'
};

export const LANGUAGES: LanguageInterface[] = [
    DEFAULT_LANGUAGE,
    {
        code: LanguageEnum.FR,
        name: msg`French`,
        emoji: '🇫🇷'
    },
    {
        code: LanguageEnum.UK,
        name: msg`Ukrainian`,
        emoji: '🇺🇦'
    },
    {
        code: LanguageEnum.DE,
        name: msg`German`,
        emoji: '🇩🇪'
    },
    {
        code: LanguageEnum.ES,
        name: msg`Spanish`,
        emoji: '🇪🇸'
    }
];
