import { RuleConditionFieldEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../../constant/suggest-rule-condition-field-labels.constant';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface Props {
    readonly availableFields: SuggestRuleConditionField[];
    readonly selectedFields: Set<SuggestRuleConditionField>;
    readonly onToggle: (field: SuggestRuleConditionField) => void;
    readonly suggestRuleData: Pick<SuggestRuleDataInterface, 'title' | 'comment' | 'mccCode'>;
}

const chipVariants = cva('flex-row items-center gap-x-sm px-lg py-md rounded-2xl border', {
    variants: {
        isSelected: {
            true: 'bg-ghost-background border-primary/20',
            false: 'bg-secondary-background/50 border-secondary-corner/50'
        }
    }
});

const checkContainerVariants = cva('rounded-full p-xxs', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-background'
        }
    }
});

const checkIconVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground/50'
        }
    }
});

const labelVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const SuggestRuleConditionSelector = ({ availableFields, selectedFields, onToggle, suggestRuleData }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row flex-wrap gap-md">
            {availableFields.map(field => {
                const isSelected = selectedFields.has(field);
                const fieldDescriptor = SUGGEST_RULE_CONDITION_FIELD_LABELS[field];
                const label = isDefined(fieldDescriptor) ? t(fieldDescriptor) : '';
                const value = getSuggestRuleFieldValue(field, suggestRuleData);
                const handleToggle = () => void onToggle(field);

                return (
                    <HapticPressable
                        key={field}
                        testID={SuggestRuleSelectors.ConditionChip(field)}
                        onPress={handleToggle}
                        className={chipVariants({ isSelected })}
                    >
                        <View className={checkContainerVariants({ isSelected })}>
                            <Icon className={checkIconVariants({ isSelected })} icon={UserIconNameEnum.Check} size={10} />
                        </View>
                        <View className="gap-y-xxs">
                            <Text className={labelVariants({ isSelected })}>{label}</Text>
                            {isNotEmptyString(value) ? (
                                <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                                    {value}
                                </Text>
                            ) : null}
                        </View>
                    </HapticPressable>
                );
            })}
        </View>
    );
};
