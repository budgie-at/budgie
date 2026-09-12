export const OnboardingDoneSelector = {
    NetWorthValue: 'OnboardingDone.NetWorthValue',
    SuccessRow: (key: string): string => `OnboardingDone.${key}`
} as const;
