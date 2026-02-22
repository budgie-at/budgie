import { RuleActionTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';

const EXCLUSIVE_ACTION_TYPES: readonly RuleActionTypeEnum[] = [RuleActionTypeEnum.SET_CATEGORY, RuleActionTypeEnum.CONVERT_TO_TRANSFER];

export const useHasConflictingRules = (actionTypes: RuleActionTypeEnum[], excludeRuleId?: number): boolean => {
    const { data: enabledRules, updatedAt } = useLiveQuery(ruleRepository.findEnabledWithRelations());

    if (!isDefined(updatedAt) || !isNotEmptyArray(enabledRules)) {
        return false;
    }

    const currentExclusiveTypes = actionTypes.filter(type => EXCLUSIVE_ACTION_TYPES.includes(type));

    if (!isNotEmptyArray(currentExclusiveTypes)) {
        return false;
    }

    const otherRules = isDefined(excludeRuleId) ? enabledRules.filter(rule => rule.id !== excludeRuleId) : enabledRules;

    return otherRules.some(rule => rule.actions.some(action => currentExclusiveTypes.includes(action.type)));
};
