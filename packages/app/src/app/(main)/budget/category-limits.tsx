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
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetCategoryLimitRow } from '../../../budget/components/budget-category-limit-row/budget-category-limit-row';
import { BudgetLimitAmountBottomSheet } from '../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { budgetService } from '../../../budget/service/budget.service';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetCategoryLimitsPage() {
    const { t } = useLingui();

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const limitAmountRef = useRef<BottomSheetInterface | null>(null);
    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { categories } = useAllCategoriesQuery();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

    const handleOpenCategorySelector = () => {
        setSelectedCategoryId(null);
        setEditingIndex(null);
        void categorySelectorRef.current?.open();
    };

    const handleEditLimit = (index: number) => {
        setSelectedCategoryId(null);
        setEditingIndex(index);
        void limitAmountRef.current?.open();
    };

    // eslint-disable-next-line max-statements
    const handleSaveLimit = async (newLimit: number) => {
        if (!isDefined(budget)) {
            return;
        }

        const budgetPayload = budgetService.getBudgetUpdatePayload(budget);

        if (isDefined(selectedCategoryId)) {
            const updatedCategoryLimits = [...budgetPayload.categoryLimits, { categoryId: selectedCategoryId, limit: newLimit }];

            try {
                await budgetService.update(budget.id, {
                    ...budgetPayload,
                    categoryLimits: updatedCategoryLimits
                });
            } catch {
                Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to add category limit` });
            }

            setSelectedCategoryId(null);

            return;
        }

        if (isDefined(editingIndex)) {
            const updatedCategoryLimits = budgetPayload.categoryLimits.map((categoryLimit, index) =>
                index === editingIndex ? { categoryId: categoryLimit.categoryId, limit: newLimit } : categoryLimit
            );

            try {
                await budgetService.update(budget.id, {
                    ...budgetPayload,
                    categoryLimits: updatedCategoryLimits
                });
            } catch {
                Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to update category limit` });
            }

            setEditingIndex(null);
        }
    };

    const handleRemoveLimit = async (index: number) => {
        if (!isDefined(budget)) {
            return;
        }

        const budgetPayload = budgetService.getBudgetUpdatePayload(budget);
        const updatedCategoryLimits = budgetPayload.categoryLimits.filter((_, categoryLimitIndex) => categoryLimitIndex !== index);

        try {
            await budgetService.update(budget.id, {
                ...budgetPayload,
                categoryLimits: updatedCategoryLimits
            });
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to remove category limit` });
        }
    };

    const handleSelectCategory = (categoryId: number | null) => {
        if (isDefined(categoryId)) {
            setSelectedCategoryId(categoryId);
            void limitAmountRef.current?.open();
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

    const selectedCategory = isDefined(selectedCategoryId)
        ? (categories.find(category => category.id === selectedCategoryId) ?? null)
        : null;

    const amountBottomSheetTitle = isDefined(editingCategoryLimit)
        ? editingCategoryLimit.category.title
        : (selectedCategory?.title ?? t`Set Category Limit`);
    const amountBottomSheetValue = isDefined(editingCategoryLimit) ? convertFromMicroUnits(editingCategoryLimit.limit) : 0;

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
                                      limit={convertFromMicroUnits(categoryLimit.limit)}
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

            <BudgetLimitAmountBottomSheet
                ref={limitAmountRef}
                title={amountBottomSheetTitle}
                value={amountBottomSheetValue}
                onSave={handleSaveLimit}
            />

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
