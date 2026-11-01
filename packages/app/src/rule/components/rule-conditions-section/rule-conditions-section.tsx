import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleConditionMatchTypeSelector } from '../rule-condition-match-type-selector/rule-condition-match-type-selector';
import { RuleConditionRow } from '../rule-condition-row/rule-condition-row';
import { RuleFormAddRow } from '../rule-form-add-row/rule-form-add-row';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

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
    const matchType = useWatch<RuleCreateInputInterface, 'conditionMatchType'>({ name: 'conditionMatchType' });
    const hasSeveralConditions = fields.length >= 2;
    const matchTypeFooter =
        matchType === RuleConditionMatchTypeEnum.ALL
            ? t`A payment has to match every condition.`
            : t`A payment only has to match one condition.`;
    const footer = hasSeveralConditions ? matchTypeFooter : t`Rules check payments as they arrive from your bank or an import.`;

    return (
        <View testID={RuleFormSelector.ConditionSectionHeader}>
            <GroupedListSection title={t`When`} footer={footer}>
                {hasSeveralConditions ? <RuleConditionMatchTypeSelector /> : null}

                {fields.map((field, index) => (
                    <RuleConditionRow key={field.id} index={index} onRemove={safeRemove} canRemove={canRemove} />
                ))}

                <RuleFormAddRow label={t`Add condition`} onPress={add} testID={RuleFormSelector.ConditionAddButton} />
            </GroupedListSection>
        </View>
    );
};
