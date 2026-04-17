export const DatePickerSelector = {
    Day: (day: string | number) => `DatePicker.Day.${day}` as const
} as const;
