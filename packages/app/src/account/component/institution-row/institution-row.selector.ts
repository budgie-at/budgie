export const InstitutionRowSelector = {
    Row: (key: number | string) => `InstitutionRow.${key}` as const,
    Total: (integrationId: number) => `InstitutionRow.Total.${integrationId}` as const
} as const;
