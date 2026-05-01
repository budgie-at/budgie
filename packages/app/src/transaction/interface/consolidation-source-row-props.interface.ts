import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

export interface ConsolidationSourceRowPropsInterface {
    readonly source: ConsolidationSourceRowInterface;
    readonly index: number;
    readonly testID?: string;
}
