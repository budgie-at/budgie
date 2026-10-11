import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface DatePickerModalParams {
    readonly initialDate?: Date;
}

const [DatePickerModalContext, useDatePickerModal, useDatePickerModalParams] = createModalContext<DatePickerModalParams, Date | null>(null);

export { useDatePickerModal, useDatePickerModalParams };

export const DatePickerModalProvider = createModalProvider(DatePickerModalContext, '/date-picker');
