import { CategorySourceEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

interface UseSimpleQuickFormActionsConfig {
    readonly amount: number;
    readonly setFromNumeric: (value: number) => void;
}

interface UseSimpleQuickFormActionsResult {
    readonly handleSelectCategory: (selectedCategoryId: number) => void;
    readonly handleSelectTag: (selectedTagId: number) => void;
    readonly handleSelectComment: (selectedComment: string) => void;
    readonly handleFillPatternAmount: (patternAmount: number) => void;
}

export const useSimpleQuickFormActions = ({ amount, setFromNumeric }: UseSimpleQuickFormActionsConfig): UseSimpleQuickFormActionsResult => {
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();

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

    return { handleSelectCategory, handleSelectTag, handleSelectComment, handleFillPatternAmount };
};
