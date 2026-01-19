import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetCategoryLimitRow } from '../../../budget/components/budget-category-limit-row/budget-category-limit-row';
import { BudgetLimitAmountBottomSheet } from '../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { budgetService } from '../../../budget/service/budget.service';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetCategoryLimitsPage() {
    const { t } = useLingui();

    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const limitAmountRef = useRef<BottomSheetInterface | null>(null);
    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);

    const { budget, isLoading } = useGetActiveBudgetQuery();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

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

        const updatedCategoryLimits = budget.categoryLimits.map((categoryLimit, index) =>
            index === editingIndex
                ? { categoryId: categoryLimit.categoryId, limit: newLimit }
                : { categoryId: categoryLimit.categoryId, limit: categoryLimit.limit }
        );

        try {
            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to update category limit` });
        }

        setEditingIndex(null);
    };

    const handleRemoveLimit = async (index: number) => {
        if (!isDefined(budget)) {
            return;
        }

        const updatedCategoryLimits = budget.categoryLimits
            .filter((_, categoryLimitIndex) => categoryLimitIndex !== index)
            .map(categoryLimit => ({ categoryId: categoryLimit.categoryId, limit: categoryLimit.limit }));

        try {
            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to remove category limit` });
        }
    };

    const handleSelectCategory = async (categoryId: number | null) => {
        if (!isDefined(budget) || !isDefined(categoryId)) {
            return;
        }

        const updatedCategoryLimits = [
            ...budget.categoryLimits.map(categoryLimit => ({ categoryId: categoryLimit.categoryId, limit: categoryLimit.limit })),
            { categoryId, limit: 0 }
        ];

        try {
            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                categoryLimits: updatedCategoryLimits
            });
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to add category limit` });
        }
    };

    if (isLoading || !isDefined(budget)) {
        return (
            <Page header={<PageHeader title={t`Category Limits`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    const editingCategoryLimit = isDefined(editingIndex) ? budget.categoryLimits[editingIndex] : null;
    const existingCategoryIds = budget.categoryLimits.map(categoryLimit => categoryLimit.categoryId);

    /* jscpd:ignore-start */
    return (
        <>
            <Page header={<PageHeader title={t`Category Limits`} onGoBack={handleGoBack} />}>
                <ScrollView className="flex-1" contentContainerClassName="py-5xl gap-y-md">
                    {isNotEmptyArray(budget.categoryLimits)
                        ? budget.categoryLimits.map((categoryLimit, index) => {
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
                </ScrollView>
            </Page>

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
    /* jscpd:ignore-end */
}
