import type { RuleActionOutcomesInterface } from './rule-action-outcomes.interface';

export interface HasConflictParamsInterface {
    readonly userCategoryId: number | null;
    readonly userTagIds: number[];
    readonly ruleOutcomes: RuleActionOutcomesInterface;
    readonly categoryChanged: boolean;
    readonly tagsChanged: boolean;
}
