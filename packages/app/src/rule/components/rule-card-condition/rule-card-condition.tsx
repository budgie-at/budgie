import { RuleConditionEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';

interface Props {
    readonly condition: RuleConditionEntityInterface;
}

export const RuleCardCondition = ({ condition }: Props) => {
    const { t } = useLingui();
    const { field, operator, value } = condition;

    return (
        <View className="flex-row items-center gap-x-sm">
            <Text className="text-xs text-secondary-foreground">|</Text>
            <Text className="text-xs text-secondary-foreground">
                <Text className="font-semibold text-primary">{t(RULE_CONDITION_FIELD[field])}</Text>
                <Text> {t(RULE_CONDITION_OPERATOR[operator])} </Text>
                <Text className="font-semibold text-primary">&quot;{value}&quot;</Text>
            </Text>
        </View>
    );
};
