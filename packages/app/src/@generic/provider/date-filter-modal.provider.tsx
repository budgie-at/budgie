import { DateFilterModalContext } from '../context/date-filter-modal.context';
import { createModalProvider } from '../utils/create-modal-provider/create-modal-provider.util';

import type { DateFilterModalParams, DateFilterResult } from '../context/date-filter-modal.context';

export const DateFilterModalProvider = createModalProvider<DateFilterModalParams, DateFilterResult | null>(
    DateFilterModalContext,
    '/date-filter'
);
