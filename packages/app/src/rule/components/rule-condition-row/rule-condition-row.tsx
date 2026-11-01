import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { cn } from '../../../@generic/utils/cn.util';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionSummaryRow } from '../rule-condition-summary-row/rule-condition-summary-row';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';

import { RuleConditionRowSelector } from './rule-condition-row.selector';

interface Props {
    readonly index: number;
    readonly isExpanded: boolean;
    readonly canRemove: boolean;
    readonly onExpand: (index: number) => void;
    readonly onRemove: (index: number) => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const ROW_TRANSITION = LinearTransition.duration(200);
const CONTENT_ENTERING = FadeIn.duration(180);

export const RuleConditionRow = ({ index, isExpanded, canRemove, onExpand, onRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const matchType = useWatch({ control, name: 'conditionMatchType' });
    const { isMissing } = useRuleConditionValueField(index);
    const isOpen = isExpanded || !canRemove || isMissing;
    const connectorLabel = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const position = index + 1;
    const headClassName = cn('flex-row', 'items-start', 'gap-x-sm', 'pl-3xl', 'pt-xs', canRemove ? 'pr-md' : 'pr-3xl');
    const handleRemove = () => void onRemove(index);
    const removeButton = canRemove ? (
        <RuleFormRemoveButton
            accessibilityLabel={t`Remove condition ${position}`}
            onPress={handleRemove}
            testID={RuleConditionRowSelector.RemoveButton(index)}
        />
    ) : null;

    return (
        <Animated.View testID={RuleConditionRowSelector.Row(index)} layout={ROW_TRANSITION}>
            <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
            {index > 0 ? (
                <View className="flex-row px-3xl pt-md">
                    <View className="rounded-full bg-surface-fill px-md py-xxs" style={CONTINUOUS_CORNERS}>
                        <Text className="text-[13px] font-semibold text-primary">{connectorLabel}</Text>
                    </View>
                </View>
            ) : null}

            {isOpen ? (
                <Animated.View key="open" entering={CONTENT_ENTERING}>
                    <View className={headClassName}>
                        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-sm">
                            <RuleConditionFieldSelector index={index} testID={RuleConditionRowSelector.FieldSelector(index)} />
                            <RuleConditionOperatorSelector index={index} testID={RuleConditionRowSelector.OperatorSelector(index)} />
                        </View>
                        {removeButton}
                    </View>

                    <View className="px-3xl pb-md">
                        <RuleConditionValueInput
                            index={index}
                            testID={RuleConditionRowSelector.ValueInput(index)}
                            secondaryTestID={RuleConditionRowSelector.SecondaryValueInput(index)}
                        />
                    </View>
                </Animated.View>
            ) : (
                <Animated.View key="closed" entering={CONTENT_ENTERING} className="flex-row items-center gap-x-sm pl-3xl pr-md">
                    <RuleConditionSummaryRow index={index} onExpand={onExpand} />
                    {removeButton}
                </Animated.View>
            )}
        </Animated.View>
    );
};
