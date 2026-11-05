export const RecurringDetailSelector = {
    Page: 'RecurringDetail.Page',
    Amount: 'RecurringDetail.Amount',
    AlertBanner: 'RecurringDetail.AlertBanner',
    EditButton: 'RecurringDetail.EditButton',
    MenuButton: 'RecurringDetail.MenuButton',
    MarkRecurringButton: 'RecurringDetail.MarkRecurringButton',
    RemoveButton: 'RecurringDetail.RemoveButton',
    ReminderSettingsButton: 'RecurringDetail.ReminderSettingsButton',
    ReminderChoice: (choice: string) => `RecurringDetail.ReminderChoice.${choice}` as const,
    NextPayment: (index: number) => `RecurringDetail.NextPayment.${index}` as const,
    HistoryRow: (transactionId: number) => `RecurringDetail.HistoryRow.${transactionId}` as const
} as const;
