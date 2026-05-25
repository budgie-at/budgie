import type { ConsolidationSourceRowInterface, TransactionConsolidationTypeEnum } from '@budgie/contracts';

export interface ConsolidationSourceRowPropsInterface {
    readonly source: ConsolidationSourceRowInterface;
    readonly index: number;
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly testID?: string;
}
