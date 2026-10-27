import { CategorySourceEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { setPrimaryCategory } from '../utils/set-primary-category.util';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

export const useSimpleQuickFormState = ({
    accountFieldName,
    setFromNumeric
}: {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly setFromNumeric: (value: number) => void;
}) => {
    const { control, getValues, setValue } = useFormContext<TransactionCreateInputInterface>();

    const title = useWatch({ control, name: 'title' });
    const comment = useWatch({ control, name: 'comment' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const entries = useWatch({ control, name: 'entries' });
    const amount = useWatch({ control, name: 'amount' });
    const watchedAccountId = useWatch({ control, name: accountFieldName });
    const categoryEntries = getTransactionCategoryEntries(entries);
    const categoryEntry = categoryEntries.at(0);

    const handleSelectCategory = (selectedCategoryId: number) => {
        const updatedEntries = setPrimaryCategory(getValues('entries'), selectedCategoryId);

        if (isDefined(updatedEntries)) {
            setValue('entries', updatedEntries, { shouldValidate: false });
        }
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
        if (isPositiveNumber(amount)) {
            return;
        }

        setValue('amount', patternAmount);
        setFromNumeric(patternAmount);
    };

    return {
        accountId: watchedAccountId ?? 0,
        categoryId: categoryEntry?.categoryId ?? null,
        mccCategoryId: categoryEntry?.mccCategoryId ?? null,
        splitEntryCount: categoryEntries.length,
        isSplitActive: categoryEntries.length > 1,
        hasTagsSelected: isNotEmptyArray(tagIds),
        isAmountPositive: isPositiveNumber(amount),
        isCategoryUserConfirmed: !isDefined(categoryEntry) || categoryEntry.categorySource !== CategorySourceEnum.MCC_DEFAULT,
        amount,
        title,
        comment,
        entries,
        handleSelectCategory,
        handleSelectTag,
        handleSelectComment,
        handleFillPatternAmount
    };
};
