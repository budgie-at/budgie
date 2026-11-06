export const RecurringPaneSelector = {
    Container: 'RecurringPane.Container',
    ListModeButton: 'RecurringPane.ListModeButton',
    CalendarModeButton: 'RecurringPane.CalendarModeButton',
    List: 'RecurringPane.List',
    EmptyState: 'RecurringPane.EmptyState',
    Summary: 'RecurringPane.Summary',
    SectionHeader: (section: string) => `RecurringPane.SectionHeader.${section}` as const,
    Row: (title: string) => `RecurringPane.Row.${title.replaceAll(/[^a-zA-Z0-9]+/gu, '_')}` as const
} as const;
