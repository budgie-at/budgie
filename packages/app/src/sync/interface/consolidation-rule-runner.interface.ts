import type { ConsolidationResultInterface } from './consolidation-result.interface';
import type { ConsolidationRuleTypeEnum } from '../enum/consolidation-rule-type.enum';

export interface ConsolidationRuleRunnerInterface {
    readonly priority: number;
    readonly type: ConsolidationRuleTypeEnum;

    countCandidates(claimedTransactionIds: Set<number>): Promise<number>;
    process(claimedTransactionIds: Set<number>, publishProgress: (processedCount: number) => void): Promise<ConsolidationResultInterface>;
}
