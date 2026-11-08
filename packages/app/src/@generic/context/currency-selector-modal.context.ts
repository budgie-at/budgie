import { InstrumentTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

import type { AnchoredMorphOriginInterface } from '../interface/anchored-morph-origin.interface';

export interface CurrencySelectorModalParams {
    readonly selectedInstrumentId?: number;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly origin?: AnchoredMorphOriginInterface;
}

export type CurrencySelectorResult = number | null;

export const [CurrencySelectorModalContext, useCurrencySelectorModal, useCurrencySelectorModalParams] = createModalContext<
    CurrencySelectorModalParams,
    CurrencySelectorResult
>(null);
