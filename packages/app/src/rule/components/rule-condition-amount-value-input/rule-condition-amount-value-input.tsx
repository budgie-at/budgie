import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { RuleValueField } from '../rule-value-field/rule-value-field';

interface Props {
    readonly index: number;
    readonly testID?: string;
    readonly secondaryTestID?: string;
}

const amountInputClassName = 'h-[44px] flex-1 border-0 px-0 text-[17px]';

const TABULAR_STYLE = { fontVariant: ['tabular-nums' as const] };

const toAmount = (value: string | null) => Number.parseFloat(value ?? '') || 0;

export const RuleConditionAmountValueInput = ({ index, testID, secondaryTestID }: Props) => {
    const { t } = useLingui();
    const [focusedInput, setFocusedInput] = useState<'from' | 'to' | null>(null);
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const { field: valueField } = useController({ control, name: `conditions.${index}.value` });
    const { field: secondaryField } = useController({ control, name: `conditions.${index}.secondaryValue` });
    const isRange = operator === RuleConditionOperatorEnum.BETWEEN;
    const valueAccessibilityLabel = isRange ? t`From amount` : t`Amount`;

    const handleValueChange = (amount: number) => void valueField.onChange(amount.toString());
    const handleSecondaryChange = (amount: number) => void secondaryField.onChange(amount.toString());
    const handleFromFocus = () => void setFocusedInput('from');
    const handleToFocus = () => void setFocusedInput('to');
    const handleBlur = () => void setFocusedInput(null);

    return (
        <View className="flex-1 gap-y-xs">
            <View className="flex-row items-center gap-x-md">
                <RuleValueField isFocused={focusedInput === 'from'} hint={null} isHintWarning={false}>
                    <AmountInput
                        testID={testID}
                        value={toAmount(valueField.value)}
                        onChangeValue={handleValueChange}
                        onFocus={handleFromFocus}
                        onBlur={handleBlur}
                        placeholder={t`Amount`}
                        accessibilityLabel={valueAccessibilityLabel}
                        inputClassName={amountInputClassName}
                        keyboardType="decimal-pad"
                        style={TABULAR_STYLE}
                    />
                    {isRange ? null : <Text className="text-[13px] text-secondary-foreground opacity-60">{t`account currency`}</Text>}
                </RuleValueField>
                {isRange ? (
                    <>
                        <Text className="text-[15px] text-secondary-foreground">
                            <Trans>and</Trans>
                        </Text>
                        <RuleValueField isFocused={focusedInput === 'to'} hint={null} isHintWarning={false}>
                            <AmountInput
                                testID={secondaryTestID}
                                value={toAmount(secondaryField.value)}
                                onChangeValue={handleSecondaryChange}
                                onFocus={handleToFocus}
                                onBlur={handleBlur}
                                placeholder={t`Amount`}
                                accessibilityLabel={t`To amount`}
                                inputClassName={amountInputClassName}
                                keyboardType="decimal-pad"
                                style={TABULAR_STYLE}
                            />
                        </RuleValueField>
                    </>
                ) : null}
            </View>
            <Text className="text-[13px] text-secondary-foreground">
                <Trans>Ignores the minus sign.</Trans>
            </Text>
        </View>
    );
};
