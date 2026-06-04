import { CategorySourceEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

export const useSimpleQuickFormState = ({
    accountFieldName,
    setFromNumeric
}: {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly setFromNumeric: (value: number) => void;
}) => {
    const { control, getValues, setValue } = useFormContext<TransactionCreateInputInterface>();

    const watchedValues = {
        comment: useWatch({ control, name: 'comment' }),
        tagIds: useWatch({ control, name: 'tagIds' }),
        entries: useWatch({ control, name: 'entries' }),
        amount: useWatch({ control, name: 'amount' }),
        accountId: useWatch({ control, name: accountFieldName })
    };
    const categoryEntries = getTransactionCategoryEntries(watchedValues.entries);
    const categoryEntry = categoryEntries.at(0);
    const derivedValues = {
        accountId: isDefined(watchedValues.accountId) ? watchedValues.accountId : 0,
        categoryId: isDefined(categoryEntry) ? categoryEntry.categoryId : null,
        splitEntryCount: categoryEntries.length,
        hasTagsSelected: isNotEmptyArray(watchedValues.tagIds),
        isAmountPositive: isPositiveNumber(watchedValues.amount),
        isCategoryUserConfirmed: !isDefined(categoryEntry) || categoryEntry.categorySource !== CategorySourceEnum.MCC_DEFAULT
    };

    const handleSelectCategory = (selectedCategoryId: number) => {
        const currentEntries = getValues('entries');
        const [currentCategoryEntry] = getTransactionCategoryEntries(currentEntries);

        if (!isDefined(currentCategoryEntry)) {
            return;
        }

        const updatedEntries = currentEntries.map(entry =>
            entry === currentCategoryEntry ? { ...entry, categoryId: selectedCategoryId, categorySource: CategorySourceEnum.USER } : entry
        );

        setValue('entries', updatedEntries, { shouldValidate: false });
    };

    const handleSelectTag = (selectedTagId: number) => {
        const currentTagIds = getValues('tagIds');

        if (currentTagIds.includes(selectedTagId)) {
            return;
        }

        setValue('tagIds', [...currentTagIds, selectedTagId]);
    };

    const handleSelectComment = (selectedComment: string) => {
        setValue('comment', selectedComment);
    };

    const handleFillPatternAmount = (patternAmount: number) => {
        if (isPositiveNumber(watchedValues.amount)) {
            return;
        }

        setValue('amount', patternAmount);
        setFromNumeric(patternAmount);
    };

    return {
        ...derivedValues,
        amount: watchedValues.amount,
        comment: watchedValues.comment,
        entries: watchedValues.entries,
        handleSelectCategory,
        handleSelectTag,
        handleSelectComment,
        handleFillPatternAmount
    };
};
