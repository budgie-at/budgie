import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { DatePickerModalContext, DatePickerModalParams } from '../context/date-picker-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const DatePickerModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<DatePickerModalParams, Date | null>('/date-picker');

    const value = { openDatePicker: open, resolveDatePicker: resolve, currentParams };

    return <DatePickerModalContext value={value}>{children}</DatePickerModalContext>;
};
