import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';
import { RuleFormRowChip } from '../rule-form-row-chip/rule-form-row-chip';

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
    const field = useWatch({ control, name: `conditions.${index}.field` });
    const connectorLabel = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const position = index + 1;
    const headClassName = cn('flex-row', 'items-center', 'gap-x-xl', 'pl-3xl', 'py-xs', canRemove ? 'pr-md' : 'pr-3xl');

    const handleRemove = () => void onRemove(index);

    return (
        <View testID={RuleConditionRowSelector.Row(index)}>
            <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
            {index > 0 ? (
                <View className="flex-row px-3xl pt-md">
                    <View className="rounded-full bg-surface-fill px-md py-xxs" style={CONTINUOUS_CORNERS}>
                        <Text className="text-[13px] font-semibold text-primary">{connectorLabel}</Text>
                    </View>
                </View>
            ) : null}

            <View className={headClassName}>
                <RuleFormRowChip meta={RULE_CONDITION_FIELD[field]} />
                <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-sm">
                    <RuleConditionFieldSelector index={index} testID={RuleConditionRowSelector.FieldSelector(index)} />
                    <RuleConditionOperatorSelector index={index} testID={RuleConditionRowSelector.OperatorSelector(index)} />
                </View>
                {canRemove ? (
                    <RuleFormRemoveButton
                        accessibilityLabel={t`Remove condition ${position}`}
                        onPress={handleRemove}
                        testID={RuleConditionRowSelector.RemoveButton(index)}
                    />
                ) : null}
            </View>

            <View className="pr-3xl pb-md pl-[64px]">
                <RuleConditionValueInput
                    index={index}
                    testID={RuleConditionRowSelector.ValueInput(index)}
                    secondaryTestID={RuleConditionRowSelector.SecondaryValueInput(index)}
                />
            </View>
        </View>
    );
};
