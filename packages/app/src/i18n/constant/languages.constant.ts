import { LanguageEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { LanguageInterface } from '../interface/language.interface';

export const LANGUAGES: LanguageInterface[] = [
    {
        code: LanguageEnum.DE,
        name: msg`German`,
        nativeName: 'Deutsch'
    },
    {
        code: LanguageEnum.EN,
        name: msg`English`,
        nativeName: 'English'
    },
    {
        code: LanguageEnum.ES,
        name: msg`Spanish`,
        nativeName: 'Español'
    },
    {
        code: LanguageEnum.FR,
        name: msg`French`,
        nativeName: 'Français'
    },
    {
        code: LanguageEnum.UK,
        name: msg`Ukrainian`,
        nativeName: 'Українська'
    }
];
