/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { EmptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { budgetService } from '../../service/budget.service';
import { BudgetCategoryLimitRow } from '../budget-category-limit-row/budget-category-limit-row';
import { BudgetLimitAmountBottomSheet } from '../budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';

import { BudgetCategoryLimitWithCategoryInterface } from './budget-category-limit-with-category.interface';

interface Props {
    readonly budgetId: number;
    readonly categoryLimits: BudgetCategoryLimitWithCategoryInterface[];
    readonly onUpdate: EmptyFn;
}

// eslint-disable-next-line max-lines-per-function
export const BudgetSettingsCategoryLimits = ({ budgetId, categoryLimits, onUpdate }: Props) => {
    const { t } = useLingui();

    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const limitAmountRef = useRef<BottomSheetInterface | null>(null);
    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);

    const { budget } = useGetActiveBudgetQuery();

    const handleOpenCategorySelector = () => {
        void categorySelectorRef.current?.open();
    };

    const handleEditLimit = (index: number) => {
        setEditingIndex(index);
        void limitAmountRef.current?.open();
    };

    const handleSaveLimit = async (newLimit: number) => {
        if (!isDefined(budget) || !isDefined(editingIndex)) {
            return;
        }

        const updatedCategoryLimits = categoryLimits.map((categoryLimit, index) =>
            index === editingIndex
                ? { categoryId: categoryLimit.categoryId, limit: newLimit }
                : { categoryId: categoryLimit.categoryId, limit: categoryLimit.limit }
        );

        try {
            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
            onUpdate();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to update category limit` });
        }

        setEditingIndex(null);
    };

    const handleRemoveLimit = async (index: number) => {
        if (!isDefined(budget)) {
            return;
        }

        const updatedCategoryLimits = categoryLimits
            .filter((_, categoryLimitIndex) => categoryLimitIndex !== index)
            .map(categoryLimit => ({ categoryId: categoryLimit.categoryId, limit: categoryLimit.limit }));

        try {
            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
            onUpdate();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to remove category limit` });
        }
    };

    const handleSelectCategory = async (categoryId: number | null) => {
        if (!isDefined(budget) || !isDefined(categoryId)) {
            return;
        }

        const updatedCategoryLimits = [
            ...categoryLimits.map(categoryLimit => ({ categoryId: categoryLimit.categoryId, limit: categoryLimit.limit })),
            { categoryId, limit: 0 }
        ];

        try {
            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
            onUpdate();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to add category limit` });
        }
    };

    const editingCategoryLimit = isDefined(editingIndex) ? categoryLimits[editingIndex] : null;
    const existingCategoryIds = categoryLimits.map(categoryLimit => categoryLimit.categoryId);

    return (
        <>
            <SettingsGroup title={t`Category Limits`}>
                <View className="gap-y-sm">
                    {isNotEmptyArray(categoryLimits)
                        ? categoryLimits.map((categoryLimit, index) => {
                              const handleEdit = () => void handleEditLimit(index);
                              const handleRemove = () => void handleRemoveLimit(index);

                              return (
                                  <BudgetCategoryLimitRow
                                      key={categoryLimit.id}
                                      category={categoryLimit.category}
                                      limit={categoryLimit.limit}
                                      onEdit={handleEdit}
                                      onRemove={handleRemove}
                                  />
                              );
                          })
                        : null}

                    <Button
                        content={<Trans>Add Category</Trans>}
                        variant="ghost"
                        onPress={handleOpenCategorySelector}
                        leftIcon={UserIconNameEnum.Plus}
                    />
                </View>
            </SettingsGroup>

            {isDefined(editingCategoryLimit) ? (
                <BudgetLimitAmountBottomSheet
                    ref={limitAmountRef}
                    title={editingCategoryLimit.category.title}
                    value={editingCategoryLimit.limit}
                    onSave={handleSaveLimit}
                />
            ) : null}

            <CategorySelectorBottomSheet
                ref={categorySelectorRef}
                selectedCategory={null}
                variant="default"
                onSelect={handleSelectCategory}
                excludeCategoryIds={existingCategoryIds}
            />
        </>
    );
};
/* jscpd:ignore-end */
