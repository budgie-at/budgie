import type { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

export interface ConsolidationFamilyBatchInterface {
    readonly candidateCount: number;
    readonly key: ConsolidationFamilyKeyEnum;
    readonly process: () => Promise<number>;
}
