import { RuleConditionFieldEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useFormContext } from 'react-hook-form';

import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { RuleConditionFormFieldEnum } from '../../enum/rule-condition-form-field.enum';
import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const FIELD_OPTIONS = [
    { value: RuleConditionFieldEnum.TITLE, label: msg`Title` },
    { value: RuleConditionFieldEnum.COMMENT, label: msg`Comment` },
    { value: RuleConditionFieldEnum.AMOUNT, label: msg`Amount` },
    { value: RuleConditionFieldEnum.ACCOUNT_ID, label: msg`Account` },
    { value: RuleConditionFieldEnum.MCC_CODE, label: msg`MCC Code` },
    { value: RuleConditionFieldEnum.TRANSACTION_TYPE, label: msg`Type` },
    { value: RuleConditionFieldEnum.EXTERNAL_SOURCE, label: msg`Source` }
];

export const RuleConditionFieldSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { getValues, setValue } = useFormContext<RuleCreateInputInterface>();

    const handleFieldChange = (field: RuleConditionFieldEnum) => {
        const validOperators = RULE_FIELD_OPERATORS[field];

        if (!validOperators.includes(getValues(`conditions.${index}.operator`))) {
            setValue(`conditions.${index}.operator`, validOperators[0]);
        }
    };

    return (
        <RuleConditionEnumSelector
            index={index}
            options={FIELD_OPTIONS}
            fieldName={RuleConditionFormFieldEnum.FIELD}
            label={t`Field`}
            sheetTitle={t`Select Field`}
            defaultLabel={t`Select Field`}
            testID={testID}
            onValueChange={handleFieldChange}
        />
    );
};
