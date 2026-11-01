import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { RuleActionAccountSelector } from '../rule-action-account-selector/rule-action-account-selector';
import { RuleActionCategorySelector } from '../rule-action-category-selector/rule-action-category-selector';
import { RuleActionTagSelector } from '../rule-action-tag-selector/rule-action-tag-selector';
import { RuleActionTypeSelector } from '../rule-action-type-selector/rule-action-type-selector';
import { RuleFormRemoveButton } from '../rule-form-remove-button/rule-form-remove-button';

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
    const headClassName = cn('flex-row', 'items-center', 'gap-x-md', 'pl-3xl', 'pt-sm', canRemove ? 'pr-md' : 'pr-3xl');

    const handleRemove = () => void onRemove(index);

    return (
        <View testID={RuleActionRowSelector.Row(index)}>
            <View className={headClassName}>
                <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                <RuleActionTypeSelector index={index} testID={RuleActionRowSelector.TypeSelector(index)} />
                {canRemove ? (
                    <RuleFormRemoveButton
                        accessibilityLabel={t`Remove action ${position}`}
                        onPress={handleRemove}
                        testID={RuleActionRowSelector.RemoveButton(index)}
                    />
                ) : null}
            </View>

            <View className="flex-row pl-[64px] pr-3xl">
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
