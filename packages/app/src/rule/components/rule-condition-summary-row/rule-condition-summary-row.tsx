import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { useRuleConditionFormatter } from '../../hooks/use-rule-condition-formatter.hook';
import { RuleConditionRowSelector } from '../rule-condition-row/rule-condition-row.selector';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';

interface Props {
    readonly index: number;
    readonly onExpand: (index: number) => void;
}

export const RuleConditionSummaryRow = ({ index, onExpand }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const condition = useWatch({ control, name: `conditions.${index}` });
    const { fieldLabel, operator, value } = useRuleConditionFormatter()(condition);
    const summary = [fieldLabel, operator, value].join(' ');

    const handlePress = () => void onExpand(index);

    return (
        <HapticPressable
            testID={RuleConditionRowSelector.Summary(index)}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={summary}
            accessibilityHint={t`Opens this condition for editing`}
            className="min-h-[52px] min-w-0 flex-1 flex-row items-center gap-x-md active:opacity-60"
        >
            <RuleValueGlyph icon={RULE_CONDITION_FIELD[condition.field].icon} variant="ghost" />
            <Text className="flex-1 text-[17px] text-primary" numberOfLines={1}>
                {summary}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
