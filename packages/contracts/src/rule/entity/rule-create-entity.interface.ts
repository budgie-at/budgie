import type { RuleEntityInterface } from './rule-entity.interface';

export type RuleCreateEntityInterface = Pick<RuleEntityInterface, 'enabled' | 'conditionMatchType'>;
