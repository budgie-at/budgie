import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { RemovableFormRow } from '../../../@generic/component/removable-form-row/removable-form-row';
import { RuleConditionFieldSelector } from '../rule-condition-field-selector/rule-condition-field-selector';
import { RuleConditionOperatorSelector } from '../rule-condition-operator-selector/rule-condition-operator-selector';
import { RuleConditionValueInput } from '../rule-condition-value-input/rule-condition-value-input';

import { RuleConditionRowSelector } from './rule-condition-row.selector';

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
    readonly canRemove: boolean;
}

export const RuleConditionRow = ({ index, onRemove, canRemove }: Props) => {
    const handleRemove = () => void onRemove(index);

    return (
        <RemovableFormRow
            testID={RuleConditionRowSelector.Row(index)}
            removeTestID={RuleConditionRowSelector.RemoveButton(index)}
            title={<Trans>Condition</Trans>}
            canRemove={canRemove}
            onRemove={handleRemove}
        >
            <View className="flex-row gap-x-lg">
                <RuleConditionFieldSelector index={index} testID={RuleConditionRowSelector.FieldSelector(index)} />
                <RuleConditionOperatorSelector index={index} testID={RuleConditionRowSelector.OperatorSelector(index)} />
            </View>

            <RuleConditionValueInput
                index={index}
                testID={RuleConditionRowSelector.ValueInput(index)}
                secondaryTestID={RuleConditionRowSelector.SecondaryValueInput(index)}
            />
        </RemovableFormRow>
    );
};
