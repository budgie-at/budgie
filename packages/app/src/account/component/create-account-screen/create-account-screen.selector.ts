import { AccountDebtTypeEnum } from '@budgie/contracts';

const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const CreateAccountScreenSelector = {
    ScrollView: 'AccountForm.ScrollView',
    NameInput: 'AccountForm.NameInput',
    CurrencySelector: 'AccountForm.CurrencySelector',
    SelectedCurrency: (code: string) => `AccountForm.SelectedCurrency.${normalizePart(code)}` as const,
    CurrencyOption: (code: string) => `AccountForm.CurrencyOption.${normalizePart(code)}` as const,
    TargetBalanceInput: 'AccountForm.TargetBalanceInput',
    IncludeInNetWorthTitle: 'AccountForm.IncludeInNetWorthTitle',
    IncludeInNetWorthRow: 'AccountForm.IncludeInNetWorthRow',
    IncludeInNetWorthSwitch: 'AccountForm.IncludeInNetWorthSwitch',
    ActiveTitle: 'AccountForm.ActiveTitle',
    ActiveRow: 'AccountForm.ActiveRow',
    ActiveSwitch: 'AccountForm.ActiveSwitch',
    DebtTypeCard: (type: AccountDebtTypeEnum) => `AccountForm.DebtType.${type}` as const,
    OpeningAccountSelector: 'AccountForm.OpeningAccountSelector',
    SelectedOpeningAccount: (name: string) => `AccountForm.SelectedOpeningAccount.${normalizePart(name)}` as const,
    ClearOpeningAccount: 'AccountForm.ClearOpeningAccount',
    ContactSelector: 'AccountForm.ContactSelector',
    ContactOption: (name: string) => `AccountForm.ContactOption.${normalizePart(name)}` as const,
    SelectedContact: (name: string) => `AccountForm.SelectedContact.${normalizePart(name)}` as const,
    ReturnDateButton: 'AccountForm.ReturnDate',
    SubmitButton: 'AccountForm.SubmitButton'
} as const;
