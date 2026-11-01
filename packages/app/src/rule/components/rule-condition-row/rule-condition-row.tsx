import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';

import { RuleConditionRowSelector } from './rule-condition-row.selector';

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
    readonly canRemove: boolean;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleConditionRow = ({ index, onRemove, canRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const matchType = useWatch({ control, name: 'conditionMatchType' });
    const connectorLabel = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const position = index + 1;
    const valueRowClassName = cn('flex-row', 'items-center', 'pl-[64px]', canRemove ? 'pr-md' : 'pr-3xl');

    const handleRemove = () => void onRemove(index);

    return (
        <View testID={RuleConditionRowSelector.Row(index)}>
            {index > 0 ? (
                <View className="flex-row px-3xl pt-md">
                    <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                    <View className="rounded-full bg-surface-fill px-md py-xxs" style={CONTINUOUS_CORNERS}>
                        <Text className="text-[13px] font-medium text-secondary-foreground">{connectorLabel}</Text>
                    </View>
                </View>
            ) : null}

            <View className="flex-row items-center gap-x-md px-3xl pt-sm">
                {index > 0 ? null : (
                    <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                )}
                <RuleConditionFieldSelector index={index} testID={RuleConditionRowSelector.FieldSelector(index)} />
                <RuleConditionOperatorSelector index={index} testID={RuleConditionRowSelector.OperatorSelector(index)} />
            </View>

            <View className={valueRowClassName}>
                <RuleConditionValueInput
                    index={index}
                    testID={RuleConditionRowSelector.ValueInput(index)}
                    secondaryTestID={RuleConditionRowSelector.SecondaryValueInput(index)}
                />
                {canRemove ? (
                    <RuleFormRemoveButton
                        accessibilityLabel={t`Remove condition ${position}`}
                        onPress={handleRemove}
                        testID={RuleConditionRowSelector.RemoveButton(index)}
                    />
                ) : null}
            </View>
        </View>
    );
};
