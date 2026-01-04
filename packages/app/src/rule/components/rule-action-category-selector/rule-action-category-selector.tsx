import { RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

interface Props {
    index: number;
}

export const RuleActionCategorySelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });
    const { categories } = useSearchCategoriesQuery('', false);
    const selectedCategory = categories?.find(category => category.id === categoryId);

    const options =
        categories?.map(category => ({
            value: category.id,
            label: category.title,
            iconSlot: (
                <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center">
                    <Icon icon={category.icon} className="text-primary" size={18} />
                </View>
            )
        })) ?? [];

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => {
        const handleSelect = (newValue: number) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <RuleSelectorField label={<Trans>Category</Trans>} value={selectedCategory?.title ?? t`Select Category`} onPress={handleOpen} />
                <RuleSelectorSheet ref={sheetRef} title={t`Select Category`} options={options} selectedValue={value} onSelect={handleSelect} />
            </>
        );
    };

    return <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />;
};
