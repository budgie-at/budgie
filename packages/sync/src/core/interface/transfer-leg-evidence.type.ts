import type { UnconsolidatedTransferLegInterface } from './unconsolidated-transfer-leg.interface';

export type TransferLegEvidenceType = (
    title: string,
    leg: Pick<UnconsolidatedTransferLegInterface, 'counterpartAliasExternalIds' | 'counterpartExternalId' | 'counterpartIban'>
) => boolean;
