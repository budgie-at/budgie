export const InstitutionRowSelector = {
    Row: (integrationId: number) => `InstitutionRow.${integrationId}` as const,
    Total: (integrationId: number) => `InstitutionRow.Total.${integrationId}` as const
} as const;
