import { CurrencySelectorModalContext } from '../context/currency-selector-modal.context';
import { createModalProvider } from '../utils/create-modal-provider/create-modal-provider.util';

import type { CurrencySelectorModalParams, CurrencySelectorResult } from '../context/currency-selector-modal.context';

export const CurrencySelectorModalProvider = createModalProvider<CurrencySelectorModalParams, CurrencySelectorResult>(
    CurrencySelectorModalContext,
    '/currency-selector'
);
