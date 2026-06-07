import type { ConsolidationResultInterface } from './consolidation-result.interface';
import type { ConsolidationRuleTypeEnum } from '../enum/consolidation-rule-type.enum';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export interface ConsolidationRuleRunnerInterface {
    readonly priority: number;
    readonly type: ConsolidationRuleTypeEnum;

    countCandidates(claimedTransactionIds: Set<number>, scope: ConsolidationScanScopeInterface | null): Promise<number>;
    process(
        claimedTransactionIds: Set<number>,
        publishProgress: (processedCount: number) => void,
        scope: ConsolidationScanScopeInterface | null
    ): Promise<ConsolidationResultInterface>;
}
