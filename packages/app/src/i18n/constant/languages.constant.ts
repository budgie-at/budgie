import { LanguageEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { LanguageInterface } from '../interface/language.interface';

const DEFAULT_LANGUAGE: LanguageInterface = {
    code: LanguageEnum.EN,
    name: msg`English`,
    nativeName: msg({ message: 'English', context: 'endonym' })
};

export const LANGUAGES: LanguageInterface[] = [
    DEFAULT_LANGUAGE,
    {
        code: LanguageEnum.FR,
        name: msg`French`,
        nativeName: msg({ message: 'Français', context: 'endonym' })
    },
    {
        code: LanguageEnum.UK,
        name: msg`Ukrainian`,
        nativeName: msg({ message: 'Українська', context: 'endonym' })
    },
    {
        code: LanguageEnum.DE,
        name: msg`German`,
        nativeName: msg({ message: 'Deutsch', context: 'endonym' })
    },
    {
        code: LanguageEnum.ES,
        name: msg`Spanish`,
        nativeName: msg({ message: 'Español', context: 'endonym' })
    }
];
