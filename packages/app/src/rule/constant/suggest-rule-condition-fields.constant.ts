import { RuleConditionFieldEnum } from '@budgie/contracts';

export type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

export const SUGGEST_RULE_CONDITION_FIELDS: SuggestRuleConditionField[] = [
    RuleConditionFieldEnum.TITLE,
    RuleConditionFieldEnum.COMMENT,
    RuleConditionFieldEnum.MCC_CODE
];
