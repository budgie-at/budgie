import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleTextInput } from '../rule-text-input/rule-text-input';

interface Props {
    readonly index: number;
}

export const RuleConditionValueInput = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const showSecondaryValue = operator === RuleConditionOperatorEnum.BETWEEN;

    const valuePlaceholder = t`Enter value...`;
    const secondaryValuePlaceholder = t`Enter secondary value...`;

    const renderValueInput = ({ field: { value, onChange } }: { field: { value: string; onChange: (value: string) => void } }) => (
        <RuleTextInput value={value} onChange={onChange} placeholder={valuePlaceholder} />
    );

    const renderSecondaryValueInput = ({ field: { value, onChange } }: { field: { value: string | null; onChange: (value: string) => void } }) => (
        <RuleTextInput value={value ?? ''} onChange={onChange} placeholder={secondaryValuePlaceholder} />
    );

    return (
        <>
            <View>
                <Text className="text-secondary-foreground text-xs mb-xs"><Trans>Value</Trans></Text>
                <Controller control={control} name={`conditions.${index}.value`} render={renderValueInput} />
            </View>

            {showSecondaryValue && (
                <View>
                    <Text className="text-secondary-foreground text-xs mb-xs"><Trans>Secondary Value</Trans></Text>
                    <Controller control={control} name={`conditions.${index}.secondaryValue`} render={renderSecondaryValueInput} />
                </View>
            )}
        </>
    );
};
