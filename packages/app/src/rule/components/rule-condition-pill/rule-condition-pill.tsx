import { RuleConditionEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';

interface Props {
    readonly condition: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value'>;
    readonly testID?: string;
}

export const RuleConditionPill = ({ condition, testID }: Props) => {
    const { t } = useLingui();
    const { field, operator, value } = condition;

    const fieldLabel = t(RULE_CONDITION_FIELD[field]);
    const operatorLabel = t(RULE_CONDITION_OPERATOR[operator]);

    return (
        <View
            className="max-w-full flex-row items-center gap-x-xs rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md"
            testID={testID}
        >
            <Text className="text-xs font-semibold text-primary">{fieldLabel}</Text>
            <Text className="text-xs text-secondary-foreground">{operatorLabel}</Text>
            <Text numberOfLines={1} className="shrink text-xs font-semibold text-primary" {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                &quot;{value}&quot;
            </Text>
        </View>
    );
};
