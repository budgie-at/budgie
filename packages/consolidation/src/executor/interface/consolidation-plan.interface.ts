import type { CanonicalTransferInputInterface } from './canonical-transfer-input.interface';

export interface ConsolidationPlanInterface {
    readonly allowedMovedSourceTransactionIds: number[];
    readonly canonicalInput: CanonicalTransferInputInterface;
    readonly sourceTransactionIds: number[];
}
