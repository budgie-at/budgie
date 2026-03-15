const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

/* eslint-disable lingui/no-unlocalized-strings */
export const LanguageSelectorSelectors = {
    SearchInput: 'LanguageSelector.SearchInput',
    Option: (code: string) => `LanguageSelector.Option.${normalizePart(code)}` as const
} as const;
