import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { RuleConditionAccountSelector } from '../rule-condition-account-selector/rule-condition-account-selector';
import { RuleConditionExternalSourceSelector } from '../rule-condition-external-source-selector/rule-condition-external-source-selector';
import { RuleConditionMccSelector } from '../rule-condition-mcc-selector/rule-condition-mcc-selector';
import { RuleConditionTransactionTypeSelector } from '../rule-condition-transaction-type-selector/rule-condition-transaction-type-selector';

interface Props {
    readonly index: number;
}

export const RuleConditionValueInput = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [field, operator] = useWatch({ control, name: [`conditions.${index}.field`, `conditions.${index}.operator`] });
    const showSecondaryValue = operator === RuleConditionOperatorEnum.BETWEEN;

    const renderValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => (
        <Input value={value} onChangeText={onChange} placeholder={t`Enter value...`} />
    );

    const renderSecondaryValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.secondaryValue`>) => (
        <Input value={value ?? ''} onChangeText={onChange} placeholder={t`Enter secondary value...`} />
    );

    const renderPrimaryInput = () => {
        switch (field) {
            case RuleConditionFieldEnum.ACCOUNT_ID:
                return <RuleConditionAccountSelector index={index} />;
            case RuleConditionFieldEnum.TRANSACTION_TYPE:
                return <RuleConditionTransactionTypeSelector index={index} />;
            case RuleConditionFieldEnum.EXTERNAL_SOURCE:
                return <RuleConditionExternalSourceSelector index={index} />;
            case RuleConditionFieldEnum.MCC_CODE:
                return <RuleConditionMccSelector index={index} />;
            default:
                return (
                    <FormItem label={t`Value`}>
                        <Controller control={control} name={`conditions.${index}.value`} render={renderValueInput} />
                    </FormItem>
                );
        }
    };

    return (
        <>
            {renderPrimaryInput()}

            {showSecondaryValue && (
                <FormItem label={t`Secondary Value`}>
                    <Controller control={control} name={`conditions.${index}.secondaryValue`} render={renderSecondaryValueInput} />
                </FormItem>
            )}
        </>
    );
};
