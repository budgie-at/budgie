import type { CanonicalTransferInputInterface } from './canonical-transfer-input.interface';

export type IbanBridgeChainCanonicalInputInterface = Omit<
    CanonicalTransferInputInterface,
    'consolidationType' | 'fromEntryExchangeRate' | 'toEntryExchangeRate'
>;
