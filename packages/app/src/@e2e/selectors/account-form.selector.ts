/* eslint-disable lingui/no-unlocalized-strings */
import { AccountTypeEnum } from '@budgie/contracts';

export const CreateAccountSelector = {
    Amount: 'CreateAccount.Amount',
    Type: (type: AccountTypeEnum) => `CreateAccount.${type}`
} as const;
