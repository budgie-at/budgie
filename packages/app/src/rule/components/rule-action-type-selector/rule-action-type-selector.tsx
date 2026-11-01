import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { EXCLUSIVE_ACTION_TYPES } from '../../constant/exclusive-action-types.constant';
import { RULE_ACTION_TYPE } from '../../constant/rule-action-type.constant';
import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { buildRuleSelectorOptions } from '../../utils/build-rule-selector-options.util';
import { RuleFormPickerHead } from '../rule-form-picker-head/rule-form-picker-head';

import type { MessageDescriptor } from '@lingui/core';

const ACTION_TYPE_VALUES = [RuleActionTypeEnum.SET_CATEGORY, RuleActionTypeEnum.ADD_TAG, RuleActionTypeEnum.CONVERT_TO_TRANSFER] as const;

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionTypeSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RuleCreateInputInterface>();
    const actions = useWatch({ control, name: 'actions' });
    const actionType = useWatch({ control, name: `actions.${index}.type` });
    const [openRuleSelector] = useRuleSelectorModal();
    const label = t(RULE_ACTION_TYPE[actionType].label);
    const usedExclusiveTypes = new Set<string>(
        actions
            .filter((_, actionIndex) => actionIndex !== index)
            .map(action => action.type)
            .filter(type => EXCLUSIVE_ACTION_TYPES.has(type))
    );
    const usedReason = t`Already in this rule`;

    const handleOpen = () => {
        const options = buildRuleSelectorOptions(ACTION_TYPE_VALUES, RULE_ACTION_TYPE, (descriptor: MessageDescriptor) =>
            t(descriptor)
        ).map(option => (usedExclusiveTypes.has(option.value) ? { ...option, disabledReason: usedReason } : option));

        openRuleSelector({ title: t`Choose an action`, options, selectedValue: actionType }, result => {
            const nextType = ACTION_TYPE_VALUES.find(value => value === result);

            if (isDefined(nextType)) {
                setValue(`actions.${index}.type`, nextType, { shouldDirty: true });
            }
        });
    };

    return (
        <RuleFormPickerHead
            meta={RULE_ACTION_TYPE[actionType]}
            label={label}
            accessibilityLabel={t`Action: ${label}`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
