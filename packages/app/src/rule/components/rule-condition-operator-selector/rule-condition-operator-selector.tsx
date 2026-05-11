import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { RuleConditionFormFieldEnum } from '../../enum/rule-condition-form-field.enum';
import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

const FIELD_OPERATORS: Record<RuleConditionFieldEnum, RuleConditionOperatorEnum[]> = {
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

const OPERATOR_LABELS: Record<RuleConditionOperatorEnum, MessageDescriptor> = {
    [RuleConditionOperatorEnum.EQUALS]: msg`Equals`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`Not Equals`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`Contains`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`Not Contains`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`Matches Regex`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`Greater Than`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`Less Than`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`Between`,
    [RuleConditionOperatorEnum.IN]: msg`In List`
};

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionOperatorSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RuleCreateInputInterface>();

    const field = useWatch({ control, name: `conditions.${index}.field` });
    const operator = useWatch({ control, name: `conditions.${index}.operator` });

    const validOperators = FIELD_OPERATORS[field];
    const options = validOperators.map(value => ({ value, label: OPERATOR_LABELS[value] }));

    useEffect(() => {
        if (!validOperators.includes(operator)) {
            setValue(`conditions.${index}.operator`, validOperators[0]);
        }
    }, [field, operator, validOperators, setValue, index]);

    return (
        <RuleConditionEnumSelector
            index={index}
            options={options}
            fieldName={RuleConditionFormFieldEnum.OPERATOR}
            label={t`Operator`}
            sheetTitle={t`Select Operator`}
            defaultLabel={t`Select Operator`}
            testID={testID}
        />
    );
};
