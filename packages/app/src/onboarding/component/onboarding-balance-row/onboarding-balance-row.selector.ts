export const OnboardingBalanceRowSelector = {
    Amount: (accountId: number): string => `OnboardingBalanceRow.${accountId}.Amount`
} as const;
