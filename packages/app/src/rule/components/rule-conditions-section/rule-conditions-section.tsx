import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleConditionMatchTypeSelector } from '../rule-condition-match-type-selector/rule-condition-match-type-selector';
import { RuleConditionRow } from '../rule-condition-row/rule-condition-row';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';
import { RuleFormSectionHeader } from '../rule-form-section-header/rule-form-section-header';

const DEFAULT_CONDITION = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: '',
    secondaryValue: null
};

export const RuleConditionsSection = () => {
    const { t } = useLingui();
    const { fields, add, safeRemove, canRemove } = useMinimumFieldArray<RuleCreateInputInterface, 'conditions'>(
        'conditions',
        DEFAULT_CONDITION
    );

    const showMatchTypeSelector = fields.length >= 2;

    return (
        <View className="gap-y-lg">
            <RuleFormSectionHeader
                title={t`Conditions`}
                onAdd={add}
                testID={RuleFormSelector.ConditionSectionHeader}
                addButtonTestID={RuleFormSelector.ConditionAddButton}
            />

            {showMatchTypeSelector && <RuleConditionMatchTypeSelector />}

            {fields.map((field, index) => (
                <RuleConditionRow key={field.id} index={index} onRemove={safeRemove} canRemove={canRemove} />
            ))}
        </View>
    );
};
