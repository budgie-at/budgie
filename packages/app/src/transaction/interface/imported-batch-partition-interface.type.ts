import { ImportedUpdateParamInterface } from './imported-update-param-interface.type';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface ImportedBatchPartitionInterface {
    readonly newInputs: readonly TransactionCreateInputInterface[];
    readonly updateParams: readonly ImportedUpdateParamInterface[];
    readonly resultsOrder: ReadonlyArray<{ readonly kind: 'create' | 'update'; readonly index: number }>;
}
