import { AccountTypeEnum } from '@budgie/contracts';

export const OnboardingAccountsSelector = {
    Option: (type: AccountTypeEnum): string => `OnboardingAccounts.${type}`,
    AddButton: 'OnboardingAccounts.AddButton',
    LeaveEmptyButton: 'OnboardingAccounts.LeaveEmptyButton'
} as const;
