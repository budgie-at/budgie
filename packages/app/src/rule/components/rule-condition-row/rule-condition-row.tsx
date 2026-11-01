import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { cn } from '../../../@generic/utils/cn.util';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionSummaryRow } from '../rule-condition-summary-row/rule-condition-summary-row';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';
import { RuleFormCollapseToggle } from '../rule-form-collapse-toggle/rule-form-collapse-toggle';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';

import { RuleConditionRowSelector } from './rule-condition-row.selector';

interface Props {
    readonly index: number;
    readonly isExpanded: boolean;
    readonly canRemove: boolean;
    readonly onExpand: (index: number | null) => void;
    readonly onRemove: (index: number) => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const ROW_TRANSITION = LinearTransition.duration(200);
const CONTENT_ENTERING = FadeIn.duration(180);
const ROW_EXITING = FadeOut.duration(200);

export const RuleConditionRow = ({ index, isExpanded, canRemove, onExpand, onRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const matchType = useWatch({ control, name: 'conditionMatchType' });
    const { isMissing } = useRuleConditionValueField(index);
    const isOpen = isExpanded || !canRemove || isMissing;
    const connectorLabel = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const position = index + 1;
    const hasConnector = index > 0;
    const canCollapse = isExpanded && canRemove && !isMissing;
    const classNames = {
        head: cn('flex-row', 'items-start', 'pl-3xl', hasConnector ? 'pt-md' : 'pt-xs', canRemove ? 'pr-md' : 'pr-3xl'),
        collapsed: cn('flex-row', 'items-center', 'pl-3xl', 'pr-md', hasConnector && 'pt-sm'),
        valueRow: cn('px-3xl', canRemove ? 'pb-[24px]' : 'pb-md')
    };
    const handleRemove = () => void onRemove(index);
    const handleCollapse = () => void onExpand(null);
    const handleExpand = () => void onExpand(index);
    const removeButton = canRemove ? (
        <RuleFormRemoveButton
            accessibilityLabel={t`Remove condition ${position}`}
            onPress={handleRemove}
            testID={RuleConditionRowSelector.RemoveButton(index)}
        />
    ) : null;

    return (
        <Animated.View testID={RuleConditionRowSelector.Row(index)} layout={ROW_TRANSITION} exiting={ROW_EXITING}>
            <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
            {hasConnector ? (
                <View
                    className="absolute -top-[11px] left-[24px] z-10 rounded-full bg-surface-disc px-md py-xxs"
                    style={CONTINUOUS_CORNERS}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    <Text className="text-[13px] font-semibold text-primary">{connectorLabel}</Text>
                </View>
            ) : null}

            {isOpen ? (
                <Animated.View key="open" entering={CONTENT_ENTERING}>
                    <View className={classNames.head}>
                        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-sm">
                            <RuleConditionFieldSelector index={index} testID={RuleConditionRowSelector.FieldSelector(index)} />
                            <RuleConditionOperatorSelector index={index} testID={RuleConditionRowSelector.OperatorSelector(index)} />
                        </View>
                        {canCollapse ? (
                            <RuleFormCollapseToggle
                                isExpanded
                                accessibilityLabel={t`Collapse condition ${position}`}
                                onPress={handleCollapse}
                            />
                        ) : null}
                        {removeButton}
                    </View>

                    <View className={classNames.valueRow}>
                        <RuleConditionValueInput
                            index={index}
                            testID={RuleConditionRowSelector.ValueInput(index)}
                            secondaryTestID={RuleConditionRowSelector.SecondaryValueInput(index)}
                        />
                    </View>
                </Animated.View>
            ) : (
                <Animated.View key="closed" entering={CONTENT_ENTERING} className={classNames.collapsed}>
                    <RuleConditionSummaryRow index={index} onExpand={onExpand} />
                    <RuleFormCollapseToggle isExpanded={false} accessibilityLabel={t`Edit condition ${position}`} onPress={handleExpand} />
                    {removeButton}
                </Animated.View>
            )}
        </Animated.View>
    );
};
