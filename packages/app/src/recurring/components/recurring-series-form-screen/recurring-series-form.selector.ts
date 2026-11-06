export const RecurringSeriesFormSelector = {
    Page: 'RecurringForm.Page',
    Save: 'RecurringForm.Save',
    Kind: (kind: string) => `RecurringForm.Kind.${kind}` as const,
    Title: 'RecurringForm.Title',
    Amount: 'RecurringForm.Amount',
    Category: 'RecurringForm.Category',
    Account: 'RecurringForm.Account',
    Repeat: (choice: string) => `RecurringForm.Repeat.${choice}` as const,
    CustomInterval: 'RecurringForm.CustomInterval',
    CustomUnit: (unit: string) => `RecurringForm.CustomUnit.${unit}` as const,
    NextDate: 'RecurringForm.NextDate',
    End: (mode: string) => `RecurringForm.End.${mode}` as const,
    EndDate: 'RecurringForm.EndDate',
    EndCount: 'RecurringForm.EndCount',
    Reminder: (choice: string) => `RecurringForm.Reminder.${choice}` as const
} as const;
