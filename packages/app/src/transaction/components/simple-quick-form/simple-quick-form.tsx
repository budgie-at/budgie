import { TransactionCreateInputInterface, TransactionEntryCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { CategorySuggestionsRow } from '../category-suggestions-row/category-suggestions-row';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { TagSuggestionsRow } from '../tag-suggestions-row/tag-suggestions-row';
import { TransactionAccountRow } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons, TransactionFieldIconsRef } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

type AccountFieldName = 'fromAccountId' | 'toAccountId';

interface BuildEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
}

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: AccountFieldName;
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly aiContext?: string;
    readonly buildEntries: (params: BuildEntryParams) => TransactionEntryCreateInputInterface[];
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export const SimpleQuickForm = (props: Props) => {
    const {
        variant,
        transactionType,
        accountFieldName,
        transactionTitle,
        mccCategoryId,
        aiContext = '',
        buildEntries,
        onSubmit,
        onCancel
    } = props;

    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers } = useQuickFormAmount({ accountFieldName });

    const comment = useWatch({ control, name: 'comment' });
    const categoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const tagIds = useWatch({ control, name: 'tagIds' });

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRef>(null);

    const handleSelectCategory = (selectedCategoryId: number) => {
        setValue('entries.0.categoryId', selectedCategoryId);
    };

    const handleSelectTag = (selectedTagId: number) => {
        const currentTagIds = getValues('tagIds');
        setValue('tagIds', [...currentTagIds, selectedTagId]);
    };

    const hasContext = isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);
    const hasCategorySelected = isPositiveNumber(categoryId);
    const hasTagsSelected = isNotEmptyArray(tagIds);
    const showCategorySuggestions = !hasCategorySelected && hasContext;
    const showTagSuggestions = hasCategorySelected && !hasTagsSelected && hasContext;

    const handleConfirm = () => {
        const amount = getValues('amount');
        const categoryId = getValues('entries.0.categoryId') ?? 0;
        const accountId = getValues(accountFieldName) ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: categoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: accountId > 0 }
        ]);

        if (!isValid) {
            return;
        }

        const entries = buildEntries({ accountId, categoryId, amount });

        setValue('entries', entries, { shouldValidate: false });

        onSubmit();
    };

    return (
        <View className="flex-1">
            <TransactionAmountDisplay ref={amountDisplayRef} amount={displayValue} currencySymbol={currencySymbol} variant={variant} />

            <MccInfoRow transactionTitle={transactionTitle} mccCategoryId={mccCategoryId} />

            {showTagSuggestions ? (
                <TagSuggestionsRow
                    transactionTitle={transactionTitle}
                    categoryId={categoryId}
                    mccCategoryId={mccCategoryId}
                    comment={comment}
                    aiContext={aiContext}
                    enabled={showTagSuggestions}
                    onSelect={handleSelectTag}
                />
            ) : (
                <CategorySuggestionsRow
                    transactionTitle={transactionTitle}
                    mccCategoryId={mccCategoryId}
                    comment={comment}
                    aiContext={aiContext}
                    enabled={showCategorySuggestions}
                    onSelect={handleSelectCategory}
                />
            )}

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={transactionType}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionAccountRow variant={variant} fieldName={accountFieldName} />
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={keypadHandlers.onDigit}
                onDecimal={keypadHandlers.onDecimal}
                onBackspace={keypadHandlers.onBackspace}
                onLongBackspace={keypadHandlers.onLongBackspace}
                onConfirm={handleConfirm}
                onCancel={onCancel}
            />
        </View>
    );
};
