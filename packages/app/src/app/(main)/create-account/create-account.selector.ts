import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

export const CreateAccountSelector = {
    type: (type: AccountTypeEnum) => `CreateAccount.${type}` as const,
    bankProvider: (bankProvider: ExternalSourceEnum) => `CreateAccount.${bankProvider}` as const,
    Amount: 'CreateAccount.Amount'
} as const;
