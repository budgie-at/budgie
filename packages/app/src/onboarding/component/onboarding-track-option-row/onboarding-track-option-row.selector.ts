import { AccountTypeEnum } from '@budgie/contracts';

export const OnboardingTrackOptionRowSelector = {
    Root: (type: AccountTypeEnum): string => `OnboardingTrackOptionRow.${type}`
} as const;
