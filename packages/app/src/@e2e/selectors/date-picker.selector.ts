/* eslint-disable lingui/no-unlocalized-strings */
export const DatePickerSelectors = {
    Day: (day: string | number) => `DatePicker.Day.${day}` as const
} as const;
