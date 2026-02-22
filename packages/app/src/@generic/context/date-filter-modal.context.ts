import { DateRangeInterface } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface DateFilterModalParams {
    readonly value: DateRangeInterface | null;
}

export type DateFilterResult = { readonly value: DateRangeInterface | null };

interface DateFilterModalContextInterface {
    openDateFilter: (params: DateFilterModalParams) => Promise<DateFilterResult | null>;
    resolveDateFilter: (result: DateFilterResult | null) => void;
    currentParams: DateFilterModalParams | null;
}

export const DateFilterModalContext = createContext<DateFilterModalContextInterface>({
    openDateFilter: () => Promise.resolve(null),
    resolveDateFilter: emptyFn,
    currentParams: null
});

export const useDateFilterModal = () => use(DateFilterModalContext);
