import { RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Platform, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
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
    const isLargeText = useIsLargeTextSize();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const condition = useWatch({ control, name: `conditions.${index}` });
    const matchType = useWatch({ control, name: 'conditionMatchType' });
    const label = useRuleConditionFormatter()(condition);
    const [before = '', after = ''] = label.sentenceTemplate.split(RULE_CONDITION_VALUE_MARKER);
    const isPattern = condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX;
    const connector = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const sentence = label.sentenceTemplate.replace(RULE_CONDITION_VALUE_MARKER, label.value);
    const summary = index > 0 ? `${connector}, ${sentence}` : sentence;
    const ellipsizeMode = isPattern ? 'middle' : 'tail';
    const valueTextProps = isPattern ? { style: MONOSPACE_STYLE } : {};

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
            {isLargeText ? (
                <Text
                    className="min-w-0 flex-1 text-[13px] text-secondary-foreground"
                    maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                >
                    {before}
                    <Text {...valueTextProps}>{label.value}</Text>
                    {after}
                </Text>
            ) : (
                <View className="min-w-0 flex-1 flex-row items-center">
                    <Text
                        className="shrink-0 text-[13px] text-secondary-foreground"
                        numberOfLines={1}
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                    >
                        {before}
                    </Text>
                    <Text
                        className="shrink text-[13px] text-secondary-foreground"
                        numberOfLines={1}
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                        ellipsizeMode={ellipsizeMode}
                        {...valueTextProps}
                    >
                        {label.value}
                    </Text>
                    <Text
                        className="shrink-0 text-[13px] text-secondary-foreground"
                        numberOfLines={1}
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                    >
                        {after}
                    </Text>
                </View>
            )}
        </HapticPressable>
    );
};
