export const DatePickerSelectors = {
    Day: (day: string | number) => `DatePicker.Day.${day}` as const
} as const;
