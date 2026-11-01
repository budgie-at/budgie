import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHasConflictingRules } from '../../hooks/use-has-conflicting-rules.hook';
import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleActionRow } from '../rule-action-row/rule-action-row';
import { RuleFormAddRow } from '../rule-form-add-row/rule-form-add-row';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

const DEFAULT_ACTION = {
    type: RuleActionTypeEnum.ADD_TAG,
    categoryId: null,
    tagId: null,
    accountId: null
};

interface Props {
    readonly ruleId?: number;
}

export const RuleActionsSection = ({ ruleId }: Props) => {
    const { t } = useLingui();
    const { fields, add, safeRemove, canRemove } = useMinimumFieldArray<RuleCreateInputInterface, 'actions'>('actions', DEFAULT_ACTION);
    const actions = useWatch<RuleCreateInputInterface, 'actions'>({ name: 'actions' });
    const hasConflict = useHasConflictingRules(
        actions.map(action => action.type),
        ruleId
    );
    const footer = hasConflict
        ? t`Some transactions may match multiple rules. The first matching rule will take priority.`
        : t`Every action runs on each matching payment.`;

    return (
        <View testID={RuleFormSelector.ActionSectionHeader}>
            <GroupedListSection title={t`Then`} footer={footer}>
                {fields.map((field, index) => (
                    <RuleActionRow key={field.id} index={index} onRemove={safeRemove} canRemove={canRemove} />
                ))}

                <RuleFormAddRow label={t`Add action`} onPress={add} testID={RuleFormSelector.ActionAddButton} />
            </GroupedListSection>
        </View>
    );
};
