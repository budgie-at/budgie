import { BudgetCreateInputInterface, BudgetIncomeExpectationCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { Footer } from '../../../../@generic/component/footer/footer';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BottomSheetInterface } from '../../../../@generic/interface/bottom-sheet.interface';
import { BudgetIncomeExpectationRow } from '../../../../budget/components/budget-income-expectation-row/budget-income-expectation-row';
import { BudgetLimitAmountBottomSheet } from '../../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';
import { CategorySelectorBottomSheet } from '../../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useSearchCategoriesQuery } from '../../../../category/query/use-search-categories.query';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetSetupIncomeExpectationsPage() {
    const { t } = useLingui();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);
    const amountBottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { form } = useBudgetSetupContext();

    const { fields, append, remove, update } = useFieldArray<BudgetCreateInputInterface, 'incomeExpectations'>({
        control: form.control,
        name: 'incomeExpectations'
    });

    const { categories } = useSearchCategoriesQuery('', true);

    const incomeExpectations = form.watch('incomeExpectations');
    const selectedCategoryIds = incomeExpectations.map(expectation => expectation.categoryId);

    const selectedCategory = isDefined(selectedCategoryId)
        ? (categories.find(category => category.id === selectedCategoryId) ?? null)
        : null;

    const editingExpectation = isDefined(editingIndex) ? incomeExpectations[editingIndex] : null;
    const editingCategory = isDefined(editingExpectation)
        ? (categories.find(category => category.id === editingExpectation.categoryId) ?? null)
        : null;

    const handleGoBack = () => void router.back();

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

    const handleSaveAmount = (amount: number) => {
        if (isDefined(selectedCategoryId)) {
            const newExpectation: BudgetIncomeExpectationCreateInputInterface = {
                categoryId: selectedCategoryId,
                expectedAmount: amount
            };
            append(newExpectation);
            setSelectedCategoryId(null);
        }
    };

    const handleEditExpectation = (index: number) => {
        setEditingIndex(index);
        void amountBottomSheetRef.current?.open();
    };

    const handleUpdateAmount = (amount: number) => {
        if (isDefined(editingIndex) && isDefined(editingExpectation)) {
            update(editingIndex, {
                ...editingExpectation,
                expectedAmount: amount
            });
            setEditingIndex(null);
        }
    };

    const handleRemoveExpectation = (index: number) => {
        remove(index);
    };

    const handleContinue = () => {
        router.push('/budget/setup/confirm');
    };

    const amountBottomSheetTitle = isDefined(editingCategory) ? editingCategory.title : (selectedCategory?.title ?? '');
    const amountBottomSheetValue = isDefined(editingExpectation) ? editingExpectation.expectedAmount : 0;
    const amountBottomSheetOnSave = isDefined(editingIndex) ? handleUpdateAmount : handleSaveAmount;

    /* jscpd:ignore-start */
    return (
        <Page
            header={<PageHeader title={t`Income Expectations`} onGoBack={handleGoBack} />}
            footer={
                <Footer>
                    <View className="flex-row gap-x-md">
                        <Button className="flex-1" variant="ghost" content={<Trans>Skip</Trans>} onPress={handleContinue} />
                        <Button className="flex-1" variant="primary" content={<Trans>Continue</Trans>} onPress={handleContinue} />
                    </View>
                </Footer>
            }
        >
            <View className="py-lg">
                {isNotEmptyArray(fields) ? (
                    <View className="mb-lg">
                        {fields.map((field, index) => {
                            const category = categories.find(category => category.id === field.categoryId);

                            if (!isDefined(category)) {
                                return null;
                            }

                            const handleEdit = () => void handleEditExpectation(index);
                            const handleRemove = () => void handleRemoveExpectation(index);

                            return (
                                <BudgetIncomeExpectationRow
                                    key={field.id}
                                    category={category}
                                    expectedAmount={field.expectedAmount}
                                    onEdit={handleEdit}
                                    onRemove={handleRemove}
                                />
                            );
                        })}
                    </View>
                ) : null}

                <View>
                    <Button
                        variant="ghost"
                        leftIcon={UserIconNameEnum.Plus}
                        content={<Trans>Add Income</Trans>}
                        onPress={handleOpenCategorySelector}
                    />
                </View>
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
        </Page>
    );
    /* jscpd:ignore-end */
}
