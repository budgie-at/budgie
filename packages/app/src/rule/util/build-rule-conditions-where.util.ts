import { RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { SQL, and, or } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { buildRuleConditionSql } from './build-rule-condition-sql.util';

import type { RuleConditionInput } from './build-rule-condition-sql.util';

interface BuildRuleConditionsWhereResult {
    readonly sqlWhere: SQL | null;
    readonly fallbackConditions: RuleConditionInput[];
}

export const buildRuleConditionsWhere = (
    conditions: RuleConditionInput[],
    conditionMatchType: RuleConditionMatchTypeEnum
): BuildRuleConditionsWhereResult => {
    const sqlConditions: SQL[] = [];
    const fallbackConditions: RuleConditionInput[] = [];

    for (const condition of conditions) {
        const sqlClause = buildRuleConditionSql(condition);

        if (isDefined(sqlClause)) {
            sqlConditions.push(sqlClause);
        } else {
            fallbackConditions.push(condition);
        }
    }

    const combiner = conditionMatchType === RuleConditionMatchTypeEnum.ALL ? and : or;
    const sqlWhere = isNotEmptyArray(sqlConditions) ? (combiner(...sqlConditions) ?? null) : null;

    return { sqlWhere, fallbackConditions };
};
