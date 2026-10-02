import { RuleActionTypeEnum } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { enabledRulesAtom } from '../constant/enabled-rules-atom.constant';
import { EXCLUSIVE_ACTION_TYPES } from '../constant/exclusive-action-types.constant';

export const useHasConflictingRules = (actionTypes: RuleActionTypeEnum[], excludeRuleId?: number): boolean => {
    const enabledRules = AsyncResult.getOrElse(useLiveAtomValue(enabledRulesAtom), () => []);

    if (!isNotEmptyArray(enabledRules)) {
        return false;
    }

    const currentExclusiveTypes = actionTypes.filter(type => EXCLUSIVE_ACTION_TYPES.has(type));

    if (!isNotEmptyArray(currentExclusiveTypes)) {
        return false;
    }

    const otherRules = isDefined(excludeRuleId) ? enabledRules.filter(rule => rule.id !== excludeRuleId) : enabledRules;

    return otherRules.some(rule => rule.actions.some(action => currentExclusiveTypes.includes(action.type)));
};
