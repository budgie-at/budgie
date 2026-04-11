const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const LanguageSelectorModalSelector = {
    SearchInput: 'LanguageSelector.SearchInput',
    Option: (code: string) => `LanguageSelector.Option.${normalizePart(code)}` as const
} as const;
