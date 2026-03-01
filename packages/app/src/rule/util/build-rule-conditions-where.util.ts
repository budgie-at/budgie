import { RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { and, or } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BuildRuleConditionsWhereResultInterface } from '../interface/build-rule-conditions-where-result.interface';

import { buildRuleConditionSql } from './build-rule-condition-sql.util';

import type { RuleConditionInput } from './build-rule-condition-sql.util';
import type { SQL } from 'drizzle-orm';

export const buildRuleConditionsWhere = (
    conditions: RuleConditionInput[],
    conditionMatchType: RuleConditionMatchTypeEnum
): BuildRuleConditionsWhereResultInterface => {
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
