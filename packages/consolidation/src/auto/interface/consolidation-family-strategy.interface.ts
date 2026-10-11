import type { ConsolidationFamilyPreviewInterface } from './consolidation-family-preview.interface';
import type { ConsolidationFamilyRunContextInterface } from './consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from './consolidation-family-run-result.interface';
import type { Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface ConsolidationFamilyStrategyInterface {
    readonly preview: (context: ConsolidationFamilyRunContextInterface) => Effect.Effect<ConsolidationFamilyPreviewInterface, DbError, Db>;
    readonly process: (
        context: ConsolidationFamilyRunContextInterface
    ) => Effect.Effect<ConsolidationFamilyRunResultInterface, DbError, Db>;
}
