import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface DatePickerModalParams {
    readonly initialDate?: Date;
}

export const [DatePickerModalContext, useDatePickerModal] = createModalContext<DatePickerModalParams, Date | null>(null);
