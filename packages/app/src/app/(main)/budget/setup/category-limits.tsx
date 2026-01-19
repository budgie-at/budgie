import { BudgetCategoryLimitCreateInputInterface, BudgetCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { ScrollView, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { Footer } from '../../../../@generic/component/footer/footer';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BottomSheetInterface } from '../../../../@generic/interface/bottom-sheet.interface';
import { BudgetCategoryLimitRow } from '../../../../budget/components/budget-category-limit-row/budget-category-limit-row';
import { BudgetLimitAmountBottomSheet } from '../../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';
import { CategorySelectorBottomSheet } from '../../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useAllCategoriesQuery } from '../../../../category/query/use-all-categories.query';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetSetupCategoryLimitsPage() {
    const { t } = useLingui();

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const categorySelectorRef = useRef<BottomSheetInterface | null>(null);
    const amountBottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { form } = useBudgetSetupContext();
    const { fields, append, remove, update } = useFieldArray<BudgetCreateInputInterface, 'categoryLimits'>({
        control: form.control,
        name: 'categoryLimits'
    });

    const { categories } = useAllCategoriesQuery();

    const existingCategoryIds = fields.map(field => field.categoryId);

    const handleGoBack = () => void router.back();

    const handleOpenCategorySelector = () => {
        setSelectedCategoryId(null);
        setEditingIndex(null);
        void categorySelectorRef.current?.open();
    };

    const handleSelectCategory = (categoryId: number | null) => {
        if (isDefined(categoryId)) {
            setSelectedCategoryId(categoryId);
            void amountBottomSheetRef.current?.open();
        }
    };

    const handleSaveAmount = (amount: number) => {
        if (isDefined(editingIndex)) {
            const existingField = fields[editingIndex];
            if (isDefined(existingField)) {
                update(editingIndex, { categoryId: existingField.categoryId, limit: amount });
            }
            setEditingIndex(null);

            return;
        }

        if (isDefined(selectedCategoryId)) {
            const newLimit: BudgetCategoryLimitCreateInputInterface = {
                categoryId: selectedCategoryId,
                limit: amount
            };
            append(newLimit);
            setSelectedCategoryId(null);
        }
    };

    const handleEditLimit = (index: number) => {
        setEditingIndex(index);
        void amountBottomSheetRef.current?.open();
    };

    const handleRemoveLimit = (index: number) => {
        remove(index);
    };

    const handleSkip = () => {
        router.push('/budget/setup/income-expectations');
    };

    const handleContinue = () => {
        router.push('/budget/setup/income-expectations');
    };

    const selectedCategory = isDefined(selectedCategoryId)
        ? (categories.find(category => category.id === selectedCategoryId) ?? null)
        : null;

    const editingField = isDefined(editingIndex) ? fields[editingIndex] : null;
    const editingCategory = isDefined(editingField) ? (categories.find(category => category.id === editingField.categoryId) ?? null) : null;

    const editingCategoryTitle = editingCategory?.title ?? '';
    const amountBottomSheetTitle = isDefined(editingCategory) ? t`Edit Limit for ${editingCategoryTitle}` : t`Set Category Limit`;
    const amountBottomSheetValue = isDefined(editingField) ? editingField.limit : 0;

    /* jscpd:ignore-start */
    return (
        <Page
            header={<PageHeader title={t`Category Limits`} onGoBack={handleGoBack} />}
            footer={
                <Footer>
                    <View className="flex-row gap-x-md">
                        <Button variant="ghost" content={<Trans>Skip</Trans>} onPress={handleSkip} className="flex-1" />
                        <Button variant="primary" content={<Trans>Continue</Trans>} onPress={handleContinue} className="flex-1" />
                    </View>
                </Footer>
            }
        >
            <ScrollView className="flex-1" contentContainerClassName="py-5xl gap-y-md">
                {isNotEmptyArray(fields)
                    ? fields.map((field, index) => {
                          const category = categories.find(category => category.id === field.categoryId);
                          if (!isDefined(category)) {
                              return null;
                          }

                          const handleEdit = () => void handleEditLimit(index);
                          const handleRemove = () => void handleRemoveLimit(index);

                          return (
                              <BudgetCategoryLimitRow
                                  key={field.id}
                                  category={category}
                                  limit={field.limit}
                                  onEdit={handleEdit}
                                  onRemove={handleRemove}
                              />
                          );
                      })
                    : null}

                <Button
                    variant="ghost"
                    leftIcon={UserIconNameEnum.Plus}
                    content={<Trans>Add Category</Trans>}
                    onPress={handleOpenCategorySelector}
                />
            </ScrollView>

            <CategorySelectorBottomSheet
                ref={categorySelectorRef}
                selectedCategory={selectedCategory}
                variant="primary"
                onSelect={handleSelectCategory}
                excludeCategoryIds={existingCategoryIds}
            />

            <BudgetLimitAmountBottomSheet
                ref={amountBottomSheetRef}
                title={amountBottomSheetTitle}
                value={amountBottomSheetValue}
                onSave={handleSaveAmount}
            />
        </Page>
    );
    /* jscpd:ignore-end */
}
