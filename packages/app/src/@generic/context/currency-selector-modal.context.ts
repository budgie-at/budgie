import { InstrumentTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface CurrencySelectorModalParams {
    readonly selectedInstrumentId?: number;
    readonly instrumentType?: InstrumentTypeEnum;
}

export type CurrencySelectorResult = number | null;

export const [CurrencySelectorModalContext, useCurrencySelectorModal] = createModalContext<
    CurrencySelectorModalParams,
    CurrencySelectorResult
>(null);
