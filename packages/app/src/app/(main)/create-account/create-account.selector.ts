import { AccountTypeEnum } from '@budgie/contracts';

export const CreateAccountSelector = {
    type: (type: AccountTypeEnum) => `CreateAccount.${type}` as const,
    Amount: 'CreateAccount.Amount'
} as const;
