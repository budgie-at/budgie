import type { RuleConditionInput } from '../util/build-rule-condition-sql.util';
import type { SQL } from 'drizzle-orm';

export interface BuildRuleConditionsWhereResultInterface {
    readonly sqlWhere: SQL | null;
    readonly fallbackConditions: RuleConditionInput[];
}
