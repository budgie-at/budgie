import { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useRef } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { hasCategoryOrTagsChanged } from '../../transaction/utils/has-category-or-tags-changed.util';
import { isBankSyncTransaction } from '../../transaction/utils/is-bank-sync-transaction.util';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

interface UseSuggestRuleOnUpdateOptions {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionInput: TransactionCreateInputInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}

export const useSuggestRuleOnUpdate = (options: UseSuggestRuleOnUpdateOptions) => {
    const { transaction, transactionInput, control } = options;
    const bottomSheetRef = useRef<BottomSheetInterface<SuggestRuleDataInterface>>(null);

    const watchedEntries = useWatch({ control, name: 'entries' });
    const watchedCategoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const watchedTagIds = useWatch({ control, name: 'tagIds' });

    const originalCategoryId = transactionInput.entries[0]?.categoryId ?? null;
    const originalTagIds = transactionInput.tagIds;

    const isBankSync = isBankSyncTransaction(transaction);
    const hasChanges = hasCategoryOrTagsChanged(
        { categoryId: originalCategoryId, tagIds: originalTagIds },
        { categoryId: watchedCategoryId, tagIds: watchedTagIds }
    );

    const shouldShowAddRule = isBankSync && hasChanges;

    const openBottomSheet = () => {
        const categoryId = watchedEntries[0]?.categoryId ?? null;

        bottomSheetRef.current?.open({
            title: transaction.title,
            comment: transaction.comment,
            mccCode: transaction.entries[0]?.mccCategory?.mcc ?? null,
            tagIds: watchedTagIds,
            categoryId,
        });
    };

    return { shouldShowAddRule, openBottomSheet, bottomSheetRef };
};
