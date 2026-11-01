import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Platform, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_CONDITION_VALUE_MARKER } from '../../constant/rule-condition-value-marker.constant';
import { useRuleConditionFormatter } from '../../hooks/use-rule-condition-formatter.hook';
import { RuleConditionRowSelector } from '../rule-condition-row/rule-condition-row.selector';

interface Props {
    readonly index: number;
    readonly onExpand: (index: number) => void;
}

const MONOSPACE_STYLE = { fontFamily: Platform.select({ ios: 'menlo', default: 'monospace' }) };

export const RuleConditionSummaryRow = ({ index, onExpand }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const condition = useWatch({ control, name: `conditions.${index}` });
    const label = useRuleConditionFormatter()(condition);
    const [before = '', after = ''] = label.sentenceTemplate.split(RULE_CONDITION_VALUE_MARKER);
    const isPattern = condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX;
    const summary = label.sentenceTemplate.replace(RULE_CONDITION_VALUE_MARKER, label.value);
    const ellipsizeMode = isPattern ? 'middle' : 'tail';

    const handlePress = () => void onExpand(index);

    return (
        <HapticPressable
            testID={RuleConditionRowSelector.Summary(index)}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={summary}
            accessibilityHint={t`Opens this condition for editing`}
            className="min-h-[52px] min-w-0 flex-1 flex-row items-center gap-x-xs pl-lg active:opacity-60"
        >
            <Icon icon={RULE_CONDITION_FIELD[condition.field].icon} size={15} className="text-primary" />
            <View className="min-w-0 flex-1 flex-row items-center">
                <Text className="shrink-0 text-[17px] text-primary" numberOfLines={1}>
                    {before}
                </Text>
                <Text
                    className="shrink text-[17px] text-primary"
                    numberOfLines={1}
                    ellipsizeMode={ellipsizeMode}
                    {...(isPattern && { style: MONOSPACE_STYLE })}
                >
                    {label.value}
                </Text>
                <Text className="shrink-0 text-[17px] text-primary" numberOfLines={1}>
                    {after}
                </Text>
            </View>
        </HapticPressable>
    );
};
