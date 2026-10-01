import type { CategorizationEvalSignalEnum } from '../enum/categorization-eval-signal.enum';
import type { CategorySourceEnum } from '@budgie/contracts';

export interface CategorizationEvalCaseInterface {
    readonly categorySource: CategorySourceEnum;
    readonly categoryId: number;
    readonly tagIds: readonly number[];
    readonly categoryPredictions: ReadonlyMap<CategorizationEvalSignalEnum, readonly number[]>;
    readonly tagPredictions: ReadonlyMap<CategorizationEvalSignalEnum, readonly number[]>;
}
