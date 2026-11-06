export const RecurringSeriesFormSelector = {
    Page: 'RecurringForm.Page',
    Save: 'RecurringForm.Save',
    Kind: 'RecurringForm.Kind',
    Title: 'RecurringForm.Title',
    Amount: 'RecurringForm.Amount',
    Currency: 'RecurringForm.Currency',
    Category: 'RecurringForm.Category',
    Account: 'RecurringForm.Account',
    Repeat: (choice: string) => `RecurringForm.Repeat.${choice}` as const,
    CustomInterval: 'RecurringForm.CustomInterval',
    CustomUnit: 'RecurringForm.CustomUnit',
    NextDate: 'RecurringForm.NextDate',
    End: (mode: string) => `RecurringForm.End.${mode}` as const,
    EndDate: 'RecurringForm.EndDate',
    EndCount: 'RecurringForm.EndCount',
    Reminder: (choice: string) => `RecurringForm.Reminder.${choice}` as const
} as const;
