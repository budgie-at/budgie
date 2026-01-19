import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetIncomeExpectationRow } from '../../../budget/components/budget-income-expectation-row/budget-income-expectation-row';
import { BudgetLimitAmountBottomSheet } from '../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { budgetService } from '../../../budget/service/budget.service';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetIncomeExpectationsPage() {
    const { t } = useLingui();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);
    const amountBottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { categories } = useSearchCategoriesQuery('', true);
    const showError = useShowError();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

    const handleOpenCategorySelector = () => {
        setSelectedCategoryId(null);
        void categorySelectorRef.current?.open();
    };

    const handleCategorySelect = (categoryId: number | null) => {
        if (isDefined(categoryId)) {
            setSelectedCategoryId(categoryId);
            void amountBottomSheetRef.current?.open();
        }
    };

    const handleSaveNewExpectation = async (amount: number) => {
        if (!isDefined(budget) || !isDefined(selectedCategoryId)) {
            return;
        }

        try {
            const newIncomeExpectations = [
                ...budget.incomeExpectations.map(expectation => ({
                    categoryId: expectation.categoryId,
                    expectedAmount: expectation.expectedAmount
                })),
                { categoryId: selectedCategoryId, expectedAmount: amount }
            ];

            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: newIncomeExpectations
            });

            setSelectedCategoryId(null);
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleEditExpectation = (index: number) => {
        setEditingIndex(index);
        void amountBottomSheetRef.current?.open();
    };

    const handleUpdateExpectationAmount = async (amount: number) => {
        if (!isDefined(budget) || !isDefined(editingIndex)) {
            return;
        }

        const editingExpectation = budget.incomeExpectations[editingIndex];
        if (!isDefined(editingExpectation)) {
            return;
        }

        try {
            const updatedIncomeExpectations = budget.incomeExpectations.map((expectation, index) => ({
                categoryId: expectation.categoryId,
                expectedAmount: index === editingIndex ? amount : expectation.expectedAmount
            }));

            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: updatedIncomeExpectations
            });

            setEditingIndex(null);
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleRemoveExpectation = async (index: number) => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            const filteredIncomeExpectations = budget.incomeExpectations
                .filter((_, expectationIndex) => expectationIndex !== index)
                .map(expectation => ({
                    categoryId: expectation.categoryId,
                    expectedAmount: expectation.expectedAmount
                }));

            await budgetService.update(budget.id, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: filteredIncomeExpectations
            });
        } catch (error: unknown) {
            showError(error);
        }
    };

    if (isLoading || !isDefined(budget)) {
        return (
            <Page header={<PageHeader title={t`Income Expectations`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    const selectedCategoryIds = budget.incomeExpectations.map(expectation => expectation.categoryId);
    const selectedCategory = isDefined(selectedCategoryId)
        ? (categories.find(category => category.id === selectedCategoryId) ?? null)
        : null;

    const editingExpectation = isDefined(editingIndex) ? budget.incomeExpectations[editingIndex] : null;
    const editingCategory = isDefined(editingExpectation)
        ? (categories.find(category => category.id === editingExpectation.categoryId) ?? null)
        : null;

    const amountBottomSheetTitle = isDefined(editingCategory) ? editingCategory.title : (selectedCategory?.title ?? '');
    const amountBottomSheetValue = isDefined(editingExpectation) ? editingExpectation.expectedAmount : 0;
    const amountBottomSheetOnSave = isDefined(editingIndex) ? handleUpdateExpectationAmount : handleSaveNewExpectation;

    /* jscpd:ignore-start */
    return (
        <>
            <Page header={<PageHeader title={t`Income Expectations`} onGoBack={handleGoBack} />}>
                <ScrollView className="flex-1" contentContainerClassName="py-5xl gap-y-md">
                    {isNotEmptyArray(budget.incomeExpectations)
                        ? budget.incomeExpectations.map((expectation, index) => {
                              const category = categories.find(category => category.id === expectation.categoryId);

                              if (!isDefined(category)) {
                                  return null;
                              }

                              const handleEdit = () => void handleEditExpectation(index);
                              const handleRemove = () => void handleRemoveExpectation(index);

                              return (
                                  <BudgetIncomeExpectationRow
                                      key={expectation.id}
                                      category={category}
                                      expectedAmount={expectation.expectedAmount}
                                      onEdit={handleEdit}
                                      onRemove={handleRemove}
                                  />
                              );
                          })
                        : null}

                    <Button
                        variant="ghost"
                        leftIcon={UserIconNameEnum.Plus}
                        content={<Trans>Add Income</Trans>}
                        onPress={handleOpenCategorySelector}
                    />
                </ScrollView>
            </Page>

            <CategorySelectorBottomSheet
                ref={categorySelectorRef}
                selectedCategory={selectedCategory}
                excludeCategoryIds={selectedCategoryIds}
                variant="positive"
                onSelect={handleCategorySelect}
            />

            <BudgetLimitAmountBottomSheet
                ref={amountBottomSheetRef}
                title={amountBottomSheetTitle}
                value={amountBottomSheetValue}
                onSave={amountBottomSheetOnSave}
            />
        </>
    );
    /* jscpd:ignore-end */
}
