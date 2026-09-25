import {
    CategoryEntityInterface,
    CategoryEvidenceRowInterface,
    CategorizeInboxRowInterface,
    InstrumentEntityInterface
} from '@budgie/contracts';

export interface CategorizeInboxBuildInputInterface {
    readonly rows: CategorizeInboxRowInterface[];
    readonly evidence: CategoryEvidenceRowInterface[];
    readonly categories: Pick<CategoryEntityInterface, 'id'>[];
    readonly defaultInstrument: Pick<InstrumentEntityInterface, 'id' | 'symbol'>;
}
