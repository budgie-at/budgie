/* jscpd:ignore-start */
import { BudgetIncomeExpectationEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { budgetService } from '../../service/budget.service';
import { BudgetIncomeExpectationRow } from '../budget-income-expectation-row/budget-income-expectation-row';
import { BudgetLimitAmountBottomSheet } from '../budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';

interface Props {
    readonly budgetId: number;
    readonly incomeExpectations: BudgetIncomeExpectationEntityInterface[];
    readonly onUpdate: EmptyFn;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const BudgetSettingsIncomeExpectations = ({ budgetId, incomeExpectations, onUpdate }: Props) => {
    const { t } = useLingui();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);
    const amountBottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { budget } = useGetActiveBudgetQuery();
    const { categories } = useSearchCategoriesQuery('', true);
    const showError = useShowError();

    const selectedCategoryIds = incomeExpectations.map(expectation => expectation.categoryId);

    const selectedCategory = isDefined(selectedCategoryId)
        ? (categories.find(category => category.id === selectedCategoryId) ?? null)
        : null;

    const editingExpectation = isDefined(editingIndex) ? incomeExpectations[editingIndex] : null;
    const editingCategory = isDefined(editingExpectation)
        ? (categories.find(category => category.id === editingExpectation.categoryId) ?? null)
        : null;

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
                ...incomeExpectations.map(expectation => ({
                    categoryId: expectation.categoryId,
                    expectedAmount: expectation.expectedAmount
                })),
                { categoryId: selectedCategoryId, expectedAmount: amount }
            ];

            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: newIncomeExpectations
            });

            setSelectedCategoryId(null);
            onUpdate();
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleEditExpectation = (index: number) => {
        setEditingIndex(index);
        void amountBottomSheetRef.current?.open();
    };

    const handleUpdateExpectationAmount = async (amount: number) => {
        if (!isDefined(budget) || !isDefined(editingIndex) || !isDefined(editingExpectation)) {
            return;
        }

        try {
            const updatedIncomeExpectations = incomeExpectations.map((expectation, index) => ({
                categoryId: expectation.categoryId,
                expectedAmount: index === editingIndex ? amount : expectation.expectedAmount
            }));

            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: updatedIncomeExpectations
            });

            setEditingIndex(null);
            onUpdate();
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleRemoveExpectation = async (index: number) => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            const filteredIncomeExpectations = incomeExpectations
                .filter((_, expectationIndex) => expectationIndex !== index)
                .map(expectation => ({
                    categoryId: expectation.categoryId,
                    expectedAmount: expectation.expectedAmount
                }));

            await budgetService.update(budgetId, {
                ...budgetService.getBudgetUpdatePayload(budget),
                incomeExpectations: filteredIncomeExpectations
            });

            onUpdate();
        } catch (error: unknown) {
            showError(error);
        }
    };

    const amountBottomSheetTitle = isDefined(editingCategory) ? editingCategory.title : (selectedCategory?.title ?? '');
    const amountBottomSheetValue = isDefined(editingExpectation) ? editingExpectation.expectedAmount : 0;
    const amountBottomSheetOnSave = isDefined(editingIndex) ? handleUpdateExpectationAmount : handleSaveNewExpectation;

    return (
        <SettingsGroup title={t`Income Expectations`}>
            {isNotEmptyArray(incomeExpectations) ? (
                <View>
                    {incomeExpectations.map((expectation, index) => {
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
                    })}
                </View>
            ) : null}

            <View className="px-7xl">
                <Button
                    variant="ghost"
                    leftIcon={UserIconNameEnum.Plus}
                    content={<Trans>Add Income</Trans>}
                    onPress={handleOpenCategorySelector}
                />
            </View>

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
        </SettingsGroup>
    );
};
/* jscpd:ignore-end */
