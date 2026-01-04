import {
    TransactionCreateInputInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { useRef } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { hasCategoryOrTagsChanged } from '../../transaction/utils/has-category-or-tags-changed.util';
import { isBankSyncTransaction } from '../../transaction/utils/is-bank-sync-transaction.util';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

interface UseSuggestRuleOnUpdateOptions {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionInput: TransactionCreateInputInterface;
}

export const useSuggestRuleOnUpdate = (options: UseSuggestRuleOnUpdateOptions) => {
    const { transaction, transactionInput } = options;
    const bottomSheetRef = useRef<BottomSheetInterface<SuggestRuleDataInterface>>(null);

    const originalCategoryId = transactionInput.entries[0]?.categoryId ?? null;
    const originalTagIds = transactionInput.tagIds;

    const handleSuccess = (data: TransactionCreateInputInterface): boolean => {
        if (!isBankSyncTransaction(transaction)) {
            return false;
        }

        const newCategoryId = data.entries[0]?.categoryId ?? null;
        const newTagIds = data.tagIds;

        if (!hasCategoryOrTagsChanged({ categoryId: originalCategoryId, tagIds: originalTagIds }, { categoryId: newCategoryId, tagIds: newTagIds })) {
            return false;
        }

        bottomSheetRef.current?.open({
            title: transaction.title,
            comment: transaction.comment,
            mccCode: transaction.entries[0]?.mccCategory?.mcc ?? null,
            categoryId: newCategoryId,
            tagIds: newTagIds
        });

        return true;
    };

    return { handleSuccess, bottomSheetRef };
};
