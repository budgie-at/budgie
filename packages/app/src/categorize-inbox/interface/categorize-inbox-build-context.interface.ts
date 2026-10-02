import { LabelEvidenceRowInterface } from '@budgie/contracts';

export interface CategorizeInboxBuildContextInterface {
    readonly exact: ReadonlyMap<string, LabelEvidenceRowInterface[]>;
    readonly merchant: ReadonlyMap<string, LabelEvidenceRowInterface[]>;
    readonly brand: ReadonlyMap<string, LabelEvidenceRowInterface[]>;
    readonly mcc: ReadonlyMap<string, LabelEvidenceRowInterface[]>;
    readonly defaultInstrumentId: number;
}
