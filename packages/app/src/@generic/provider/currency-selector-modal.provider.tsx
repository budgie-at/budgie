import { ReactNode } from 'react';

import {
    CurrencySelectorModalContext,
    CurrencySelectorModalParams,
    CurrencySelectorResult
} from '../context/currency-selector-modal.context';
import { useModalResolver } from '../hook/use-modal-resolver/use-modal-resolver.hook';

interface Props {
    readonly children: ReactNode;
}

export const CurrencySelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<CurrencySelectorModalParams, CurrencySelectorResult>('/currency-selector');

    const value = { openCurrencySelector: open, resolveCurrencySelector: resolve, currentParams };

    return <CurrencySelectorModalContext value={value}>{children}</CurrencySelectorModalContext>;
};
