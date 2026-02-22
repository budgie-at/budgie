import { RuleConditionEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';

interface Props {
    readonly condition: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value'>;
}

export const RuleConditionPill = ({ condition }: Props) => {
    const { t } = useLingui();
    const { field, operator, value } = condition;

    const fieldLabel = t(RULE_CONDITION_FIELD[field]);
    const operatorLabel = t(RULE_CONDITION_OPERATOR[operator]);

    return (
        <View className="max-w-full flex-row items-center gap-x-xs rounded-2xl border border-primary/15 bg-ghost-background px-lg py-md">
            <Text className="text-xs font-semibold text-primary">{fieldLabel}</Text>
            <Text className="text-xs text-secondary-foreground">{operatorLabel}</Text>
            <Text numberOfLines={1} className="shrink text-xs font-semibold text-primary">&quot;{value}&quot;</Text>
        </View>
    );
};
