import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { DatePickerModalContext, DatePickerModalParams } from '../context/date-picker-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const DatePickerModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<DatePickerModalParams | null>(null);
    const resolverRef = useRef<((date: Date | null) => void) | null>(null);

    const openDatePicker = (params?: DatePickerModalParams): Promise<Date | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/date-picker');
        });

    const resolveDatePicker = (date: Date | null) => {
        resolverRef.current?.(date);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openDatePicker, resolveDatePicker, currentParams };

    return <DatePickerModalContext value={value}>{children}</DatePickerModalContext>;
};
