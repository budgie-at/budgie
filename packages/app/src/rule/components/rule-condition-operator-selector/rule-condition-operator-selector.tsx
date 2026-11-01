import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';
import { RULE_FIELD_OPERATORS } from '../../constant/rule-field-operators.constant';
import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { buildRuleSelectorOptions } from '../../utils/build-rule-selector-options.util';

import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleConditionOperatorSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const [openRuleSelector] = useRuleSelectorModal();
    const validOperators = RULE_FIELD_OPERATORS[field];
    const label = t(RULE_CONDITION_OPERATOR[operator].label);

    const handleOpen = () => {
        openRuleSelector(
            {
                title: t`How to compare`,
                options: buildRuleSelectorOptions(validOperators, RULE_CONDITION_OPERATOR, (descriptor: MessageDescriptor) =>
                    t(descriptor)
                ),
                selectedValue: operator
            },
            result => {
                const nextOperator = validOperators.find(value => value === result);

                if (isDefined(nextOperator)) {
                    setValue(`conditions.${index}.operator`, nextOperator, { shouldDirty: true });
                }
            }
        );
    };

    return (
        <HapticPressable
            testID={testID}
            onPress={handleOpen}
            accessibilityRole="button"
            accessibilityLabel={t`Condition: ${label}`}
            className="min-h-[44px] max-w-[55%] shrink-0 justify-center active:opacity-70"
        >
            <View className="flex-row items-center gap-x-xs rounded-full bg-surface-fill px-lg py-sm" style={CONTINUOUS_CORNERS}>
                <Text className="shrink text-[15px] font-medium text-primary" numberOfLines={1}>
                    {label}
                </Text>
                <Icon icon={UserIconNameEnum.ChevronDown} size={12} className="text-secondary-foreground" />
            </View>
        </HapticPressable>
    );
};
