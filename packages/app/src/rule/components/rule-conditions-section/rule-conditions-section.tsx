import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { useMatchingTransactionCount } from '../../hooks/use-matching-transaction-count.hook';
import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleConditionMatchTypeSelector } from '../rule-condition-match-type-selector/rule-condition-match-type-selector';
import { RuleConditionRow } from '../rule-condition-row/rule-condition-row';
import { RuleFormSectionHeader } from '../rule-form-section-header/rule-form-section-header';
import { RuleMatchingCount } from '../rule-matching-count/rule-matching-count';

const DEFAULT_CONDITION = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: '',
    secondaryValue: null
};

export const RuleConditionsSection = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const { fields, add, safeRemove, canRemove } = useMinimumFieldArray<RuleCreateInputInterface, 'conditions'>(
        'conditions',
        DEFAULT_CONDITION
    );

    const conditions = useWatch({ control, name: 'conditions' });
    const conditionMatchType = useWatch({ control, name: 'conditionMatchType' });

    const hasNonEmptyCondition = conditions.some(condition => isNotEmptyString(condition.value));
    const { count, isLoading } = useMatchingTransactionCount({ conditions, conditionMatchType, enabled: hasNonEmptyCondition });

    const showMatchTypeSelector = fields.length >= 2;

    return (
        <View className="gap-y-lg">
            <RuleFormSectionHeader
                title={t`Conditions`}
                onAdd={add}
                testID={RuleFormSelectors.ConditionSectionHeader}
                addButtonTestID={RuleFormSelectors.ConditionAddButton}
            />

            {showMatchTypeSelector && <RuleConditionMatchTypeSelector />}

            {fields.map((field, index) => (
                <RuleConditionRow key={field.id} index={index} onRemove={safeRemove} canRemove={canRemove} />
            ))}

            <RuleMatchingCount count={count} isLoading={isLoading} />
        </View>
    );
};
