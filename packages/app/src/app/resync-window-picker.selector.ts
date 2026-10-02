export const ResyncWindowPickerSelector = {
    Option: (sinceDays: number | 'all') => `ResyncWindowPicker.Option.${sinceDays}` as const
} as const;
