import { RuleConditionOperatorEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { RuleOptionMetaInterface } from '../interface/rule-option-meta.interface';

export const RULE_CONDITION_OPERATOR: Record<RuleConditionOperatorEnum, RuleOptionMetaInterface> = {
    [RuleConditionOperatorEnum.EQUALS]: {
        label: msg`Is`,
        phrase: msg`is`,
        description: msg`Exact match, any letter case`,
        icon: UserIconNameEnum.Target,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.NOT_EQUALS]: {
        label: msg`Is not`,
        phrase: msg`is not`,
        description: msg`Anything except this value`,
        icon: UserIconNameEnum.Ban,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.CONTAINS]: {
        label: msg`Contains`,
        phrase: msg`contains`,
        description: msg`The text appears anywhere`,
        icon: UserIconNameEnum.TextSearch,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.NOT_CONTAINS]: {
        label: msg`Does not contain`,
        phrase: msg`does not contain`,
        description: msg`The text appears nowhere`,
        icon: UserIconNameEnum.SearchX,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.MATCHES_REGEX]: {
        label: msg`Matches pattern`,
        phrase: msg`matches`,
        description: msg`Advanced regular expression`,
        icon: UserIconNameEnum.Regex,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.GREATER_THAN]: {
        label: msg`More than`,
        phrase: msg`is more than`,
        description: msg`Above this amount`,
        icon: UserIconNameEnum.ArrowUp,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.LESS_THAN]: {
        label: msg`Less than`,
        phrase: msg`is less than`,
        description: msg`Below this amount`,
        icon: UserIconNameEnum.ArrowDown,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.BETWEEN]: {
        label: msg`Between`,
        phrase: msg`is between`,
        description: msg`From one amount to another`,
        icon: UserIconNameEnum.ArrowUpDown,
        variant: 'ghost'
    },
    [RuleConditionOperatorEnum.IN]: {
        label: msg`Is any of`,
        phrase: msg`is any of`,
        description: msg`Matches one of several values`,
        icon: UserIconNameEnum.ListFilter,
        variant: 'ghost'
    }
};
