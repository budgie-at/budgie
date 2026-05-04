import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { useHasConflictingRules } from '../../hooks/use-has-conflicting-rules.hook';
import { useMinimumFieldArray } from '../../hooks/use-minimum-field-array.hook';
import { RuleActionRow } from '../rule-action-row/rule-action-row';
import { RuleConflictWarning } from '../rule-conflict-warning/rule-conflict-warning';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';
import { RuleFormSectionHeader } from '../rule-form-section-header/rule-form-section-header';

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

    const actionTypes = actions.map(action => action.type);
    const hasConflict = useHasConflictingRules(actionTypes, ruleId);

    return (
        <View className="gap-y-lg">
            <RuleFormSectionHeader
                title={t`Actions`}
                onAdd={add}
                testID={RuleFormSelector.ActionSectionHeader}
                addButtonTestID={RuleFormSelector.ActionAddButton}
            />
            <Text className="text-secondary-foreground text-sm">
                <Trans>Actions to apply when conditions match</Trans>
            </Text>
            {fields.map((field, index) => (
                <RuleActionRow key={field.id} index={index} onRemove={safeRemove} canRemove={canRemove} />
            ))}
            <RuleConflictWarning hasConflict={hasConflict} />
        </View>
    );
};
