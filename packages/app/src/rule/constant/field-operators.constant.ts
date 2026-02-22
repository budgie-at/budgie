import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

export const FIELD_OPERATORS: Record<RuleConditionFieldEnum, RuleConditionOperatorEnum[]> = {
    [RuleConditionFieldEnum.TITLE]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.CONTAINS,
        RuleConditionOperatorEnum.NOT_CONTAINS,
        RuleConditionOperatorEnum.MATCHES_REGEX
    ],
    [RuleConditionFieldEnum.COMMENT]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.CONTAINS,
        RuleConditionOperatorEnum.NOT_CONTAINS,
        RuleConditionOperatorEnum.MATCHES_REGEX
    ],
    [RuleConditionFieldEnum.AMOUNT]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.GREATER_THAN,
        RuleConditionOperatorEnum.LESS_THAN,
        RuleConditionOperatorEnum.BETWEEN
    ],
    [RuleConditionFieldEnum.ACCOUNT_ID]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.IN
    ],
    [RuleConditionFieldEnum.MCC_CODE]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.IN
    ],
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.IN
    ],
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: [
        RuleConditionOperatorEnum.EQUALS,
        RuleConditionOperatorEnum.NOT_EQUALS,
        RuleConditionOperatorEnum.CONTAINS,
        RuleConditionOperatorEnum.NOT_CONTAINS
    ]
};
