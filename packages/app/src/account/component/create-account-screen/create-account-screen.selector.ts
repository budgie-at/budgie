import { AccountDebtTypeEnum } from '@budgie/contracts';

const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const CreateAccountScreenSelector = {
    NameInput: 'AccountForm.NameInput',
    CurrencySelector: 'AccountForm.CurrencySelector',
    CurrencyOption: (code: string) => `AccountForm.CurrencyOption.${normalizePart(code)}` as const,
    TargetBalanceInput: 'AccountForm.TargetBalanceInput',
    IncludeInNetWorthTitle: 'AccountForm.IncludeInNetWorthTitle',
    IncludeInNetWorthRow: 'AccountForm.IncludeInNetWorthRow',
    IncludeInNetWorthSwitch: 'AccountForm.IncludeInNetWorthSwitch',
    ActiveTitle: 'AccountForm.ActiveTitle',
    ActiveRow: 'AccountForm.ActiveRow',
    ActiveSwitch: 'AccountForm.ActiveSwitch',
    DebtTypeCard: (type: AccountDebtTypeEnum) => `AccountForm.DebtType.${type}` as const,
    ContactSelector: 'AccountForm.ContactSelector',
    ContactOption: (name: string) => `AccountForm.ContactOption.${normalizePart(name)}` as const,
    SelectedContact: (name: string) => `AccountForm.SelectedContact.${normalizePart(name)}` as const,
    ReturnDateButton: 'AccountForm.ReturnDate',
    SubmitButton: 'AccountForm.SubmitButton'
} as const;
