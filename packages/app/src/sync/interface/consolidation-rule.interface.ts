import type { ConsolidationExecutionResultInterface } from './consolidation-execution-result.interface';
import type { ConsolidationSourceMoveRequestInterface } from './consolidation-source-move-request.interface';
import type { ConsolidationTagCopyRequestInterface } from './consolidation-tag-copy-request.interface';
import type { ConsolidationRuleTypeEnum } from '../enum/consolidation-rule-type.enum';
import type { ConsolidationScanScopeInterface, DB } from '@budgie/contracts';

export interface ConsolidationRuleInterface<Candidate> {
    readonly priority: number;
    readonly type: ConsolidationRuleTypeEnum;

    buildSourceMoveRequests(candidate: Candidate, result: ConsolidationExecutionResultInterface): ConsolidationSourceMoveRequestInterface[];
    buildTagCopyRequests(candidate: Candidate, result: ConsolidationExecutionResultInterface): ConsolidationTagCopyRequestInterface[];
    consolidate(candidate: Candidate, tx: DB): Promise<ConsolidationExecutionResultInterface>;
    findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<Candidate[]>;
    getSourceTransactionIds(candidate: Candidate): number[];
}
