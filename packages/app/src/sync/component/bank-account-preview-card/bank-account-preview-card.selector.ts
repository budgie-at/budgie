const normalizePart = (value: string) => value.replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const BankAccountPreviewCardSelector = {
    Row: (title: string) => `SyncAccountSelection.Row.${normalizePart(title)}` as const,
    Toggle: (title: string) => `SyncAccountSelection.Toggle.${normalizePart(title)}` as const
} as const;
