import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';

interface Props {
    readonly index: number;
    readonly testID?: string;
    readonly secondaryTestID?: string;
}

const amountInputClassName = 'h-[48px] flex-1 border-0 px-0 text-[17px]';

const toAmount = (value: string | null) => Number.parseFloat(value ?? '') || 0;

export const RuleConditionAmountValueInput = ({ index, testID, secondaryTestID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const { field: valueField } = useController({ control, name: `conditions.${index}.value` });
    const { field: secondaryField } = useController({ control, name: `conditions.${index}.secondaryValue` });
    const isRange = operator === RuleConditionOperatorEnum.BETWEEN;
    const valueAccessibilityLabel = isRange ? t`From amount` : t`Amount`;

    const handleValueChange = (amount: number) => void valueField.onChange(amount.toString());
    const handleSecondaryChange = (amount: number) => void secondaryField.onChange(amount.toString());

    return (
        <View className="flex-1 flex-row items-center gap-x-md">
            <AmountInput
                testID={testID}
                value={toAmount(valueField.value)}
                onChangeValue={handleValueChange}
                placeholder={t`Amount`}
                accessibilityLabel={valueAccessibilityLabel}
                inputClassName={amountInputClassName}
            />
            {isRange ? (
                <>
                    <Text className="text-[15px] text-secondary-foreground">
                        <Trans>and</Trans>
                    </Text>
                    <AmountInput
                        testID={secondaryTestID}
                        value={toAmount(secondaryField.value)}
                        onChangeValue={handleSecondaryChange}
                        placeholder={t`Amount`}
                        accessibilityLabel={t`To amount`}
                        inputClassName={amountInputClassName}
                    />
                </>
            ) : null}
        </View>
    );
};
