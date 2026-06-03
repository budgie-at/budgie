import { CategorySourceEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

interface UseSimpleQuickFormValuesConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
}

interface UseSimpleQuickFormValuesResult {
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number | null;
    readonly comment: string;
    readonly entries: TransactionCreateInputInterface['entries'];
    readonly hasTagsSelected: boolean;
    readonly isAmountPositive: boolean;
    readonly isCategoryUserConfirmed: boolean;
    readonly splitEntryCount: number;
}

export const useSimpleQuickFormValues = ({ accountFieldName }: UseSimpleQuickFormValuesConfig): UseSimpleQuickFormValuesResult => {
    const { control } = useFormContext<TransactionCreateInputInterface>();

    const comment = useWatch({ control, name: 'comment' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const entries = useWatch({ control, name: 'entries' });
    const amount = useWatch({ control, name: 'amount' });
    const watchedAccountId = useWatch({ control, name: accountFieldName });

    const accountId = isDefined(watchedAccountId) ? watchedAccountId : 0;
    const categoryEntries = getTransactionCategoryEntries(entries);
    const categoryEntry = categoryEntries.at(0);
    const categoryId = isDefined(categoryEntry) ? categoryEntry.categoryId : null;
    const splitEntryCount = categoryEntries.length;
    const hasTagsSelected = isNotEmptyArray(tagIds);
    const isAmountPositive = isPositiveNumber(amount);
    const isCategoryUserConfirmed = !isDefined(categoryEntry) || categoryEntry.categorySource !== CategorySourceEnum.MCC_DEFAULT;

    return {
        accountId,
        amount,
        categoryId,
        comment,
        entries,
        hasTagsSelected,
        isAmountPositive,
        isCategoryUserConfirmed,
        splitEntryCount
    };
};
