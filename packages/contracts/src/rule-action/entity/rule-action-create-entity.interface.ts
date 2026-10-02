import type { RuleActionEntityInterface } from './rule-action-entity.interface';

export type RuleActionCreateEntityInterface = Pick<RuleActionEntityInterface, 'ruleId' | 'type' | 'categoryId' | 'tagId' | 'accountId'>;
