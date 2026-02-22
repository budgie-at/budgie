import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { DatePickerModalContext } from '../context/date-picker-modal.context';

import type { DatePickerModalParams } from '../context/date-picker-modal.context';

export const DatePickerModalProvider = createModalProvider<DatePickerModalParams, Date | null>(DatePickerModalContext, '/date-picker');
