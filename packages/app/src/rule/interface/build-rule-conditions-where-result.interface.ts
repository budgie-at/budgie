import type { RuleConditionInputInterface } from './rule-condition-input.interface';
import type { SQL } from 'drizzle-orm';

export interface BuildRuleConditionsWhereResultInterface {
    readonly sqlWhere: SQL | null;
    readonly fallbackConditions: RuleConditionInputInterface[];
}
