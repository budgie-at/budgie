export const RecurringPaneSelector = {
    Container: 'RecurringPane.Container',
    ViewToggleButton: 'RecurringPane.ViewToggleButton',
    AddButton: 'RecurringPane.AddButton',
    List: 'RecurringPane.List',
    EmptyState: 'RecurringPane.EmptyState',
    Summary: 'RecurringPane.Summary',
    PossibleHeader: 'RecurringPane.PossibleHeader',
    Row: (title: string) => `RecurringPane.Row.${title.replaceAll(/[^a-zA-Z0-9]+/gu, '_')}` as const
} as const;
