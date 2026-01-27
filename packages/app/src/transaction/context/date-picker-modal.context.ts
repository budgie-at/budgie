import { createContext, use } from 'react';

export interface DatePickerModalParams {
    readonly initialDate?: Date;
}

interface DatePickerModalContextInterface {
    readonly openDatePicker: (params?: DatePickerModalParams) => Promise<Date | null>;
    readonly resolveDatePicker: (date: Date | null) => void;
    readonly currentParams: DatePickerModalParams | null;
}

export const DatePickerModalContext = createContext<DatePickerModalContextInterface | null>(null);

export const useDatePickerModal = () => {
    const context = use(DatePickerModalContext);

    if (context === null) {
        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error
        throw new Error('useDatePickerModal must be used within DatePickerModalProvider');
    }

    return context;
};
