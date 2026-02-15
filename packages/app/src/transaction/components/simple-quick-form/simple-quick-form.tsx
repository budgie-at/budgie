/* eslint-disable max-lines */
import {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFormSelectors } from '../../../@e2e/selectors/transaction-form.selector';
import { accountRepository } from '../../../@generic/drizzle/db/db';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useSplitEntriesModal } from '../../context/split-entries-modal.context';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons, TransactionFieldIconsRef } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

type AccountFieldName = 'fromAccountId' | 'toAccountId';

interface BuildEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
    readonly mccCategoryId: number | null;
}

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: AccountFieldName;
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly showAutomateButton?: boolean;
    readonly onAutomateSubmit?: () => void;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
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
        showAutomateButton = false,
        onAutomateSubmit,
        aiContext = '',
        isNewTransaction = false,
        buildEntries,
        onSubmit,
        onCancel
    } = props;

    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers, setFromNumeric } = useQuickFormAmount({ accountFieldName });
    const [openSplitEntries] = useSplitEntriesModal();

    const entryType = getEntryTypeForTransaction(transactionType);

    const comment = useWatch({ control, name: 'comment' });
    const categoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const entries = useWatch({ control, name: 'entries' });
    const amount = useWatch({ control, name: 'amount' });
    const accountId = useWatch({ control, name: accountFieldName }) ?? 0;

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

    const handleSelectComment = (selectedComment: string) => {
        setValue('comment', selectedComment);
    };

    const handleFillPatternAmount = (patternAmount: number) => {
        if (amount > 0) {
            return;
        }

        setValue('amount', patternAmount);
        setFromNumeric(patternAmount);
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
    const hasTagsSelected = isNotEmptyArray(tagIds);

    const validateAndBuildEntries = (): boolean => {
        const amount = getValues('amount');
        const formCategoryId = getValues('entries.0.categoryId') ?? 0;
        const formAccountId = getValues(accountFieldName) ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: formCategoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: formAccountId > 0, shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return false;
        }

        const builtEntries = buildEntries({ accountId: formAccountId, categoryId: formCategoryId, amount, mccCategoryId });
        setValue('entries', builtEntries, { shouldValidate: false });

        return true;
    };

    const handleNormalConfirm = () => {
        if (!validateAndBuildEntries()) {
            return;
        }

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

    const handleAutomate = () => {
        if (isSplitActive) {
            handleSplitConfirm();
        } else if (validateAndBuildEntries()) {
            onAutomateSubmit?.();
        }
    };

    return (
        <View className="flex-1">
            <View className="flex-1">
                <TransactionAmountDisplay
                    testID={TransactionFormSelectors.AmountInput}
                    ref={amountDisplayRef}
                    amount={displayValue}
                    currencySymbol={currencySymbol}
                    variant={variant}
                />
                <View className="absolute bottom-0 left-0 right-0 gap-md">
                    <MccInfoRow transactionTitle={transactionTitle} mccCategoryId={mccCategoryId} />
                    <SuggestionsContainer
                        isNewTransaction={isNewTransaction}
                        isSplitActive={isSplitActive}
                        transactionType={transactionType}
                        transactionTitle={transactionTitle}
                        categoryId={categoryId}
                        mccCategoryId={mccCategoryId}
                        comment={comment}
                        aiContext={aiContext}
                        accountId={accountId}
                        amount={amount}
                        hasTagsSelected={hasTagsSelected}
                        onSelectCategory={handleSelectCategory}
                        onSelectTag={handleSelectTag}
                        onSelectComment={handleSelectComment}
                        onFillPatternAmount={handleFillPatternAmount}
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
                categorySelectorTestID={TransactionFormSelectors.CategorySelector}
            />

            <View className="mb-xl">
                <TransactionAccountRow
                    testID={TransactionFormSelectors.AccountSelector}
                    ref={accountRowRef}
                    variant={variant}
                    fieldName={accountFieldName}
                />
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={keypadHandlers.onDigit}
                onDecimal={keypadHandlers.onDecimal}
                onBackspace={keypadHandlers.onBackspace}
                onLongBackspace={keypadHandlers.onLongBackspace}
                onConfirm={handleConfirm}
                onCancel={onCancel}
                confirmTestID={TransactionFormSelectors.SubmitButton}
                showAutomateButton={showAutomateButton}
                onAutomate={handleAutomate}
            />
        </View>
    );
};
