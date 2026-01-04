import { LanguageEnum } from '@budgie/contracts';

export const languageToLocale = (language: LanguageEnum): string => {
    switch (language) {
        case LanguageEnum.EN:
            return 'en-US';
        case LanguageEnum.FR:
            return 'fr-FR';
        case LanguageEnum.UK:
            return 'uk-UA';
        case LanguageEnum.DE:
            return 'de-DE';
        case LanguageEnum.ES:
            return 'es-ES';
    }
};
