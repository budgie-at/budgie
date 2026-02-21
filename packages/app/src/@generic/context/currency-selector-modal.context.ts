import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface CurrencySelectorModalParams {
    readonly selectedInstrumentId?: number;
}

export type CurrencySelectorResult = number | null;

interface CurrencySelectorModalContextInterface {
    openCurrencySelector: (params?: CurrencySelectorModalParams) => Promise<CurrencySelectorResult>;
    resolveCurrencySelector: (result: CurrencySelectorResult) => void;
    currentParams: CurrencySelectorModalParams | null;
}

export const CurrencySelectorModalContext = createContext<CurrencySelectorModalContextInterface>({
    openCurrencySelector: () => Promise.resolve(null),
    resolveCurrencySelector: emptyFn,
    currentParams: null
});

export const useCurrencySelectorModal = () => use(CurrencySelectorModalContext);
