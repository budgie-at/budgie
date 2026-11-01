import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleConditionMatchTypeSelector } from '../rule-condition-match-type-selector/rule-condition-match-type-selector';
import { RuleConditionRow } from '../rule-condition-row/rule-condition-row';
import { RuleFormAddRow } from '../rule-form-add-row/rule-form-add-row';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

const OPERATOR_HELP: Record<RuleConditionOperatorEnum, MessageDescriptor> = {
    [RuleConditionOperatorEnum.EQUALS]: msg`Matches only this exact value, ignoring letter case.`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`Matches everything except this exact value.`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`Matches when the text appears anywhere, ignoring letter case.`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`Matches when the text appears nowhere.`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`Uses a regular expression of up to 200 characters, ignoring letter case.`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`Matches payments above this amount.`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`Matches payments below this amount.`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`Matches payments from the first amount to the second, both included.`,
    [RuleConditionOperatorEnum.IN]: msg`Matches any of the chosen values.`
};

const getFirstIncompleteIndex = (conditions: RuleCreateInputInterface['conditions']) => {
    const incompleteIndex = conditions.findIndex(condition => !isNotEmptyString(condition.value.trim()));

    return incompleteIndex >= 0 ? incompleteIndex : null;
};

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
    const [matchType, firstOperator] = useWatch<RuleCreateInputInterface, ['conditionMatchType', 'conditions.0.operator']>({
        name: ['conditionMatchType', 'conditions.0.operator']
    });
    const { getValues } = useFormContext<RuleCreateInputInterface>();
    const [expandedIndex, setExpandedIndex] = useState(() => getFirstIncompleteIndex(getValues('conditions')));
    const hasSeveralConditions = fields.length >= 2;

    const handleAdd = () => {
        setExpandedIndex(fields.length);
        add();
    };
    const handleRemove = (index: number) => {
        setExpandedIndex(null);
        safeRemove(index);
    };
    const matchTypeFooter =
        matchType === RuleConditionMatchTypeEnum.ALL
            ? t`A payment has to match every condition.`
            : t`A payment only has to match one condition.`;
    const footer = hasSeveralConditions ? matchTypeFooter : t(OPERATOR_HELP[firstOperator]);

    return (
        <View testID={RuleFormSelector.ConditionSectionHeader}>
            <GroupedListSection title={t`When`} footer={footer}>
                {hasSeveralConditions ? <RuleConditionMatchTypeSelector /> : null}

                {fields.map((field, index) => (
                    <RuleConditionRow
                        key={field.id}
                        index={index}
                        isExpanded={index === expandedIndex}
                        canRemove={canRemove}
                        onExpand={setExpandedIndex}
                        onRemove={handleRemove}
                    />
                ))}

                <RuleFormAddRow label={t`Add condition`} onPress={handleAdd} testID={RuleFormSelector.ConditionAddButton} />
            </GroupedListSection>
        </View>
    );
};
