import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { EXCLUSIVE_ACTION_TYPES } from '../../constant/exclusive-action-types.constant';
import { RULE_ACTION_TYPE } from '../../constant/rule-action-type.constant';
import { useRuleOptionSheet } from '../../hooks/use-rule-option-sheet.hook';
import { RuleFormPickerPill } from '../rule-form-picker-pill/rule-form-picker-pill';

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
    const openActionSheet = useRuleOptionSheet(t`Choose an action`, RULE_ACTION_TYPE);
    const label = t(RULE_ACTION_TYPE[actionType].label);
    const usedExclusiveTypes = new Set<string>(
        actions
            .filter((_, actionIndex) => actionIndex !== index)
            .map(action => action.type)
            .filter(type => EXCLUSIVE_ACTION_TYPES.has(type))
    );

    const handleSelect = (nextType: RuleActionTypeEnum) => void setValue(`actions.${index}.type`, nextType, { shouldDirty: true });
    const handleOpen = () =>
        void openActionSheet({
            values: ACTION_TYPE_VALUES,
            selectedValue: actionType,
            disabledValues: usedExclusiveTypes,
            onSelect: handleSelect
        });

    return <RuleFormPickerPill label={label} accessibilityLabel={t`Action: ${label}`} onPress={handleOpen} testID={testID} />;
};
