import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';

import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface DateFilterModalParams {
    readonly value: DateRangeInterface | null;
    readonly title?: string;
    readonly applyLabel?: string;
    readonly periods?: readonly DatePeriodEnum[];
}

export type DateFilterResult = { readonly value: DateRangeInterface | null };

export const [DateFilterModalContext, useDateFilterModal, useDateFilterModalParams] = createModalContext<
    DateFilterModalParams,
    DateFilterResult | null
>(null);
