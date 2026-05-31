import { SQL, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { transactionRuleRepository } from '../../@generic/drizzle/db/db';
import { RuleApplyStatusInterface } from '../interface/rule-apply-status.interface';
import { ruleMatcherService } from '../service/rule-matcher.service';
import { buildRuleAppliedWhere } from '../util/build-rule-applied-where.util';

import type { RuleWithRelationsEntityInterface } from '@budgie/contracts';

const UNAVAILABLE_WHERE: SQL = sql`0 = 1`;

export const useRuleApplyStatus = (rule: RuleWithRelationsEntityInterface): RuleApplyStatusInterface => {
    const matchedWhere = ruleMatcherService.buildMatchedWhere(rule);
    const appliedWhere = buildRuleAppliedWhere(rule.actions);
    const query = transactionRuleRepository.buildApplyStatusQuery(matchedWhere ?? UNAVAILABLE_WHERE, appliedWhere);
    const { data } = useLiveQuery(query, [rule.id]);

    const available = isDefined(matchedWhere);
    const [row] = data;
    const matched = isEmptyArray(data) ? 0 : row.matched;
    const applied = isEmptyArray(data) ? 0 : row.applied;

    return {
        available,
        isLoading: available && isEmptyArray(data),
        matched,
        applied,
        pending: Math.max(0, matched - applied)
    };
};
