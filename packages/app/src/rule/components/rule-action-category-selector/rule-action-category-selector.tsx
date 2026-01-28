import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => bottomSheetRef.current?.open();

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => {
        const handleSelect = (id: number | null) => {
            if (isDefined(id)) {
                onChange(id);
                void bottomSheetRef.current?.dismiss();
            }
        };

        return (
            <>
                <RuleSelectorField
                    label={t`Category`}
                    value={selectedCategory?.title ?? t`Select Category`}
                    onPress={handleOpen}
                    testID={testID}
                />
                <CategorySelectorBottomSheet
                    ref={bottomSheetRef}
                    variant="primary"
                    selectedCategory={selectedCategory ?? null}
                    onSelect={handleSelect}
                />
            </>
        );
    };

    return <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />;
};
