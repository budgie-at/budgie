/* eslint-disable lingui/no-unlocalized-strings */
import { AccountTypeEnum } from '@budgie/contracts';

export const CreateAccountSelectors = {
    type: (type: AccountTypeEnum) => `CreateAccount.${type}` as const,
    Amount: 'CreateAccount.Amount'
} as const;
