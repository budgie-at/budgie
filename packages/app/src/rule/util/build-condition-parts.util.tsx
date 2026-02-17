import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { Fragment, type ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { RULE_CONDITION_FIELD } from '../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../constant/rule-condition-operator.constant';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from './get-suggest-rule-field-value.util';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

export const buildConditionParts = (
    selectedFields: Set<SuggestRuleConditionField>,
    suggestRuleData: SuggestRuleDataInterface,
    translateFn: (descriptor: { id: string; message?: string }) => string
): ReactNode[] => {
    const parts: ReactNode[] = [];

    for (const field of selectedFields) {
        const value = getSuggestRuleFieldValue(field, suggestRuleData);

        if (isDefined(value)) {
            const fieldLabel = translateFn(RULE_CONDITION_FIELD[field]);
            const operatorLabel = translateFn(RULE_CONDITION_OPERATOR[RuleConditionOperatorEnum.CONTAINS]);

            parts.push(
                <Fragment key={field}>
                    <Text className="font-semibold text-foreground">{fieldLabel}</Text> {operatorLabel}{' '}
                    <Text className="font-semibold text-foreground">&quot;{value}&quot;</Text>
                </Fragment>
            );
        }
    }

    return parts;
};
