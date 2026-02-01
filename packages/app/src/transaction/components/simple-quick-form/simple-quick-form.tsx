import {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { useSplitEntries } from '../../hook/use-split-entries.hook';
import { useSplitKeypadSync } from '../../hook/use-split-keypad-sync.hook';
import { CategorySuggestionsRow } from '../category-suggestions-row/category-suggestions-row';
import { SplitEntryList } from '../split-entry-list/split-entry-list';
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
    readonly initialSplitMode?: boolean;
    readonly buildEntries: (params: BuildEntryParams) => TransactionEntryCreateInputInterface[];
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

const EXPENSE_ENTRY_TYPE = TransactionEntryTypeEnum.CREDIT;
const INCOME_ENTRY_TYPE = TransactionEntryTypeEnum.DEBIT;

const getEntryTypeForTransaction = (transactionType: TransactionTypeEnum): TransactionEntryTypeEnum =>
    transactionType === TransactionTypeEnum.EXPENSE ? EXPENSE_ENTRY_TYPE : INCOME_ENTRY_TYPE;

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export const SimpleQuickForm = (props: Props) => {
    const {
        variant,
        transactionType,
        accountFieldName,
        transactionTitle,
        mccCategoryId,
        aiContext = '',
        initialSplitMode = false,
        buildEntries,
        onSubmit,
        onCancel
    } = props;

    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers } = useQuickFormAmount({ accountFieldName });

    const entryType = getEntryTypeForTransaction(transactionType);
    const split = useSplitEntries({ entryType, accountFieldName, initialSplitMode });

    const splitKeypad = useSplitKeypadSync(split);

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
    const showCategorySuggestions = !hasCategorySelected && hasContext && !split.isSplitMode;
    const showTagSuggestions = hasCategorySelected && !hasTagsSelected && hasContext && !split.isSplitMode;

    const handleNormalConfirm = () => {
        const amount = getValues('amount');
        const formCategoryId = getValues('entries.0.categoryId') ?? 0;
        const accountId = getValues(accountFieldName) ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: formCategoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: accountId > 0 }
        ]);

        if (!isValid) {
            return;
        }

        const entries = buildEntries({ accountId, categoryId: formCategoryId, amount });

        setValue('entries', entries, { shouldValidate: false });

        onSubmit();
    };

    const handleSplitConfirm = () => {
        const accountId = getValues(accountFieldName) ?? 0;
        const allEntriesValid = split.entries.every(entry => entry.amount > 0 && isPositiveNumber(entry.categoryId));

        const isValid = validateAndShake([
            { isValid: split.totalAmount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: allEntriesValid },
            { isValid: accountId > 0 }
        ]);

        if (!isValid) {
            return;
        }

        setValue('amount', split.totalAmount);

        onSubmit();
    };

    const handleConfirm = () => {
        if (split.isSplitMode) {
            handleSplitConfirm();

            return;
        }

        handleNormalConfirm();
    };

    const splitTotalDisplay = split.totalAmount === 0 ? '0' : split.totalAmount.toString();
    const activeDisplayValue = split.isSplitMode ? splitTotalDisplay : displayValue;

    const activeKeypadHandlers = split.isSplitMode ? splitKeypad.handlers : keypadHandlers;

    return (
        <View className="flex-1">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={activeDisplayValue}
                currencySymbol={currencySymbol}
                variant={variant}
            />

            {split.isSplitMode ? (
                <SplitEntryList
                    entries={split.entries}
                    entryIds={split.entryIds}
                    activeEntryIndex={split.activeEntryIndex}
                    currencySymbol={currencySymbol}
                    onSelectEntry={split.setActiveEntryIndex}
                    onAddEntry={split.addEntry}
                />
            ) : null}

            {!split.isSplitMode && showTagSuggestions ? (
                <TagSuggestionsRow
                    transactionTitle={transactionTitle}
                    categoryId={categoryId}
                    mccCategoryId={mccCategoryId}
                    comment={comment}
                    aiContext={aiContext}
                    enabled={showTagSuggestions}
                    onSelect={handleSelectTag}
                />
            ) : null}

            {!split.isSplitMode && !showTagSuggestions ? (
                <CategorySuggestionsRow
                    transactionTitle={transactionTitle}
                    mccCategoryId={mccCategoryId}
                    comment={comment}
                    aiContext={aiContext}
                    enabled={showCategorySuggestions}
                    onSelect={handleSelectCategory}
                />
            ) : null}

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={transactionType}
                isSplitMode={split.isSplitMode}
                onToggleSplit={split.toggleSplitMode}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionAccountRow variant={variant} fieldName={accountFieldName} />
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={activeKeypadHandlers.onDigit}
                onDecimal={activeKeypadHandlers.onDecimal}
                onBackspace={activeKeypadHandlers.onBackspace}
                onLongBackspace={activeKeypadHandlers.onLongBackspace}
                onConfirm={handleConfirm}
                onCancel={onCancel}
            />
        </View>
    );
};
