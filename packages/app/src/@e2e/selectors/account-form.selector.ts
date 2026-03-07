/* eslint-disable lingui/no-unlocalized-strings */
import { AccountDebtTypeEnum } from '@budgie/contracts';

const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, '_');

export const AccountFormSelectors = {
    NameInput: 'AccountForm.NameInput',
    CurrencySelector: 'AccountForm.CurrencySelector',
    CurrencyOption: (code: string) => `AccountForm.CurrencyOption.${normalizePart(code)}` as const,
    TargetBalanceInput: 'AccountForm.TargetBalanceInput',
    DebtTypeCard: (type: AccountDebtTypeEnum) => `AccountForm.DebtType.${type}` as const,
    ContactSelector: 'AccountForm.ContactSelector',
    ContactOption: (name: string) => `AccountForm.ContactOption.${normalizePart(name)}` as const,
    SelectedContact: (name: string) => `AccountForm.SelectedContact.${normalizePart(name)}` as const,
    ReturnDateButton: 'AccountForm.ReturnDate',
    SubmitButton: 'AccountForm.SubmitButton'
} as const;
