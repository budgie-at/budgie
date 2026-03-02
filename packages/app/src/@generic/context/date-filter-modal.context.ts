import { DateRangeInterface } from '@budgie/contracts';

import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface DateFilterModalParams {
    readonly value: DateRangeInterface | null;
}

export type DateFilterResult = { readonly value: DateRangeInterface | null };

export const [DateFilterModalContext, useDateFilterModal] = createModalContext<DateFilterModalParams, DateFilterResult | null>(null);
