export const EnableBankingConnectAccountRowSelector = {
    Row: (externalId: string) => `EnableBankingConnectAccountRow.${externalId}` as const
} as const;
