import { RuleConditionCreateInputInterface, RuleConditionOperatorEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SUGGEST_RULE_CONDITION_FIELDS } from '../constant/suggest-rule-condition-fields.constant';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { getSuggestRuleFieldValue } from './get-suggest-rule-field-value.util';

export const buildSuggestRuleConditions = (
    suggestRuleData: Pick<SuggestRuleDataInterface, 'title' | 'comment' | 'mccCode'>
): RuleConditionCreateInputInterface[] =>
    SUGGEST_RULE_CONDITION_FIELDS.filter(field => isNotEmptyString(getSuggestRuleFieldValue(field, suggestRuleData))).flatMap(field => {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        if (!isDefined(value)) {
            return [];
        }

        return { field, operator: RuleConditionOperatorEnum.CONTAINS, value, secondaryValue: null };
    });
