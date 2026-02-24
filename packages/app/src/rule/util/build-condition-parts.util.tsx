import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { Fragment, type ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { RULE_CONDITION_FIELD } from '../constant/rule-condition-field.constant';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { getSuggestRuleFieldValue } from './get-suggest-rule-field-value.util';

const IS_OPERATOR = msg`is`;

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
            const operatorLabel = translateFn(IS_OPERATOR);

            parts.push(
                <Fragment key={field}>
                    <Text className="font-semibold text-primary">{fieldLabel.toLowerCase()}</Text> {operatorLabel}{' '}
                    <Text className="font-semibold text-primary">&quot;{value}&quot;</Text>
                </Fragment>
            );
        }
    }

    return parts;
};
