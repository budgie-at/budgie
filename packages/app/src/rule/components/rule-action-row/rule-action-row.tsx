import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { RULE_ACTION_TYPE } from '../../constant/rule-action-type.constant';
import { RuleActionAccountSelector } from '../rule-action-account-selector/rule-action-account-selector';
import { RuleActionCategorySelector } from '../rule-action-category-selector/rule-action-category-selector';
import { RuleActionTagSelector } from '../rule-action-tag-selector/rule-action-tag-selector';
import { RuleActionTypeSelector } from '../rule-action-type-selector/rule-action-type-selector';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';
import { RuleFormRowChip } from '../rule-form-row-chip/rule-form-row-chip';

import { RuleActionRowSelector } from './rule-action-row.selector';

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
    readonly canRemove: boolean;
}

export const RuleActionRow = ({ index, onRemove, canRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const actionType = useWatch({ control, name: `actions.${index}.type` });
    const position = index + 1;
    const headClassName = cn('flex-row', 'items-center', 'gap-x-xl', 'pl-3xl', 'py-xs', canRemove ? 'pr-md' : 'pr-3xl');

    const handleRemove = () => void onRemove(index);

    return (
        <View testID={RuleActionRowSelector.Row(index)}>
            <View className={headClassName}>
                <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                <RuleFormRowChip meta={RULE_ACTION_TYPE[actionType]} />
                <View className="min-w-0 flex-1 flex-row">
                    <RuleActionTypeSelector index={index} testID={RuleActionRowSelector.TypeSelector(index)} />
                </View>
                {canRemove ? (
                    <RuleFormRemoveButton
                        accessibilityLabel={t`Remove action ${position}`}
                        onPress={handleRemove}
                        testID={RuleActionRowSelector.RemoveButton(index)}
                    />
                ) : null}
            </View>

            <View className="flex-row pr-3xl pb-xs pl-[64px]">
                {actionType === RuleActionTypeEnum.SET_CATEGORY ? (
                    <RuleActionCategorySelector index={index} testID={RuleActionRowSelector.CategorySelector(index)} />
                ) : null}
                {actionType === RuleActionTypeEnum.ADD_TAG ? (
                    <RuleActionTagSelector index={index} testID={RuleActionRowSelector.TagSelector(index)} />
                ) : null}
                {actionType === RuleActionTypeEnum.CONVERT_TO_TRANSFER ? (
                    <RuleActionAccountSelector index={index} testID={RuleActionRowSelector.AccountSelector(index)} />
                ) : null}
            </View>
        </View>
    );
};
