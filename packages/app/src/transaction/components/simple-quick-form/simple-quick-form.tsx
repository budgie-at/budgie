import {
    RepeatedTransactionPatternInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useSplitEntriesModal } from '../../context/split-entries-modal.context';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { SuggestionRowSwitcher } from '../suggestion-row-switcher/suggestion-row-switcher';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
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
        buildEntries,
        onSubmit,
        onCancel
    } = props;

    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers, setFromNumeric } = useQuickFormAmount({ accountFieldName });
    const { openSplitEntries } = useSplitEntriesModal();

    const entryType = getEntryTypeForTransaction(transactionType);

    const comment = useWatch({ control, name: 'comment' });
    const categoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const entries = useWatch({ control, name: 'entries' });
    const amount = useWatch({ control, name: 'amount' });

    const splitEntryCount = entries.length;
    const isAmountPositive = amount > 0;

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRef>(null);
    const accountRowRef = useRef<TransactionAccountRowRef>(null);

    const handleSelectCategory = (selectedCategoryId: number) => {
        setValue('entries.0.categoryId', selectedCategoryId);
    };

    const handleSelectTag = (selectedTagId: number) => {
        const currentTagIds = getValues('tagIds');
        setValue('tagIds', [...currentTagIds, selectedTagId]);
    };

    const handleSelectRepeatedPattern = (pattern: RepeatedTransactionPatternInterface) => {
        setValue('entries.0.categoryId', pattern.categoryId);
        setValue('tagIds', pattern.tagIds);
        setValue('amount', pattern.averageAmount);
        setFromNumeric(pattern.averageAmount);
        setValue('title', pattern.title);
        if (isNotEmptyString(pattern.comment)) {
            setValue('comment', pattern.comment);
        }
    };

    const handleSplitPress = async () => {
        const currentEntries = getValues('entries');
        const accountId = getValues(accountFieldName) ?? 0;
        const currentAmount = getValues('amount');
        const currentCategoryId = getValues('entries.0.categoryId') ?? 0;

        const initialEntries =
            currentEntries.length > 1
                ? currentEntries
                : [
                      {
                          accountId,
                          categoryId: currentCategoryId,
                          amount: 0,
                          type: entryType,
                          mccCategoryId: null,
                          externalId: null
                      }
                  ];

        const result = await openSplitEntries({
            entries: initialEntries,
            variant,
            entryType,
            currencySymbol,
            totalAmount: currentAmount
        });

        if (isDefined(result)) {
            const hasMultipleEntries = result.length > 1;
            const hasSingleEntryWithAmount = result.length === 1 && result[0].amount > 0;

            if (hasMultipleEntries || hasSingleEntryWithAmount) {
                setValue('entries', result, { shouldValidate: false });
                const totalAmount = sumEntryAmounts(result);
                setValue('amount', totalAmount);
            }
        }
    };

    const isSplitActive = splitEntryCount > 1;
    const hasContext = isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);
    const hasCategorySelected = isPositiveNumber(categoryId);
    const hasTagsSelected = isNotEmptyArray(tagIds);
    const accountId = useWatch({ control, name: accountFieldName }) ?? 0;
    const showRepeatedSuggestions = !hasCategorySelected && !isSplitActive && isPositiveNumber(accountId);
    const showCategorySuggestions = !hasCategorySelected && hasContext && !isSplitActive && !showRepeatedSuggestions;
    const showTagSuggestions = hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    const handleNormalConfirm = () => {
        const amount = getValues('amount');
        const formCategoryId = getValues('entries.0.categoryId') ?? 0;
        const accountId = getValues(accountFieldName) ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: formCategoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: accountId > 0, shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        const builtEntries = buildEntries({ accountId, categoryId: formCategoryId, amount });

        setValue('entries', builtEntries, { shouldValidate: false });

        onSubmit();
    };

    const handleSplitConfirm = () => {
        const accountId = getValues(accountFieldName) ?? 0;
        const currentEntries = getValues('entries');
        const allEntriesValid = currentEntries.every(entry => entry.amount > 0 && isPositiveNumber(entry.categoryId));
        const totalAmount = sumEntryAmounts(currentEntries);

        const isValid = validateAndShake([
            { isValid: totalAmount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: allEntriesValid },
            { isValid: accountId > 0, shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        setValue('amount', totalAmount);

        onSubmit();
    };

    const handleSplitIconPress = () => void handleSplitPress();

    const handleConfirm = () => {
        if (isSplitActive) {
            handleSplitConfirm();

            return;
        }

        handleNormalConfirm();
    };

    return (
        <View className="flex-1">
            <View className="flex-1">
                <TransactionAmountDisplay ref={amountDisplayRef} amount={displayValue} currencySymbol={currencySymbol} variant={variant} />
                <View className="absolute bottom-0 left-0 right-0 gap-md">
                    <MccInfoRow transactionTitle={transactionTitle} mccCategoryId={mccCategoryId} />
                    <SuggestionRowSwitcher
                        isSplitActive={isSplitActive}
                        showTagSuggestions={showTagSuggestions}
                        showCategorySuggestions={showCategorySuggestions}
                        showRepeatedSuggestions={showRepeatedSuggestions}
                        transactionType={transactionType}
                        accountId={accountId}
                        amount={amount}
                        transactionTitle={transactionTitle}
                        categoryId={categoryId}
                        mccCategoryId={mccCategoryId}
                        comment={comment}
                        aiContext={aiContext}
                        onSelectTag={handleSelectTag}
                        onSelectCategory={handleSelectCategory}
                        onSelectRepeatedPattern={handleSelectRepeatedPattern}
                    />
                </View>
            </View>

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={transactionType}
                splitEntryCount={splitEntryCount}
                isAmountPositive={isAmountPositive}
                onSplitPress={handleSplitIconPress}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionAccountRow ref={accountRowRef} variant={variant} fieldName={accountFieldName} />
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
