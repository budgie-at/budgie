import type { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import type { ConsolidationFamilyRunContextInterface } from './consolidation-family-run-context.interface';
import type { ConsolidationScanScopeInterface, Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface ConsolidationFamilyDefinitionInterface<Candidate> {
    readonly key: ConsolidationFamilyKeyEnum;
    readonly findCandidates: (scope: ConsolidationScanScopeInterface | null) => Effect.Effect<readonly Candidate[], DbError, Db>;
    readonly consolidateCandidate: (candidate: Candidate) => Effect.Effect<boolean, DbError, Db>;
    readonly getSourceTransactionIds: (candidate: Candidate) => number[];
    readonly getScopeTransactionIds?: (candidate: Candidate) => number[];
    readonly prepareProcess?: (context: ConsolidationFamilyRunContextInterface) => Effect.Effect<void, DbError, Db>;
    readonly shouldRepeatAfterSuccessfulPass?: boolean;
}
