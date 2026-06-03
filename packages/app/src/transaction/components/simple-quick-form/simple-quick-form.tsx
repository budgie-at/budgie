/* eslint-disable max-lines -- Form orchestration component grew with categorySource plumbing for MCC default suggestions (approved by user). */
import {
    CategorySourceEnum,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { ReactNode, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { RuleDetectionModeEnum } from '../../../rule/enum/rule-detection-mode.enum';
import { useSplitEntriesModal } from '../../context/split-entries-modal.context';
import { useTransactionFeeModal } from '../../context/transaction-fee-modal.context';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { QuickFormBottomOverlay } from '../quick-form-bottom-overlay/quick-form-bottom-overlay';
import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

import { SimpleQuickFormSelector } from './simple-quick-form.selector';

import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';
import type { TransactionFieldIconsRefInterface } from '../../interface/transaction-field-icons-ref.interface';

type AccountFieldName = 'fromAccountId' | 'toAccountId';

interface BuildEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
    readonly mccCategoryId: number | null;
}

interface Props extends RulePillSlotPropsInterface {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: AccountFieldName;
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
    readonly amountTopContent?: ReactNode;
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
        isNewTransaction = false,
        amountTopContent,
        buildEntries,
        onSubmit,
        onCancel,
        ruleDetectionMode = RuleDetectionModeEnum.NONE,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        matchingRuleIds,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    } = props;

    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers, setFromNumeric } = useQuickFormAmount({ accountFieldName });
    const [openSplitEntries] = useSplitEntriesModal();
    const [openTransactionFee] = useTransactionFeeModal();

    const entryType = getEntryTypeForTransaction(transactionType);

    const comment = useWatch({ control, name: 'comment' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const entries = useWatch({ control, name: 'entries' });
    const amount = useWatch({ control, name: 'amount' });
    const accountId = useWatch({ control, name: accountFieldName }) ?? 0;

    const categoryEntries = getTransactionCategoryEntries(entries);
    const feeEntries = getTransactionFeeEntries(entries);
    const categoryEntry = categoryEntries.at(0);
    const categoryId = categoryEntry?.categoryId ?? null;
    const categorySource = categoryEntry?.categorySource ?? CategorySourceEnum.USER;
    const feeAmount = sumEntryAmounts(feeEntries);
    const splitEntryCount = categoryEntries.length;
    const isAmountPositive = amount > 0;

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRefInterface>(null);
    const accountRowRef = useRef<TransactionAccountRowRef>(null);

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
        if (amount > 0) {
            return;
        }

        setValue('amount', patternAmount);
        setFromNumeric(patternAmount);
    };

    const buildInitialSplitEntries = (
        currentCategoryEntries: TransactionEntryCreateInputInterface[],
        accountId: number
    ): TransactionEntryCreateInputInterface[] => {
        if (currentCategoryEntries.length > 1) {
            return currentCategoryEntries;
        }

        return [
            {
                accountId,
                categoryId: currentCategoryEntries.at(0)?.categoryId ?? 0,
                amount: 0,
                type: entryType,
                mccCategoryId: null,
                externalId: null
            }
        ];
    };

    const applySplitResult = (
        result: TransactionEntryCreateInputInterface[],
        currentFeeEntries: TransactionEntryCreateInputInterface[],
        feeTotal: number
    ) => {
        const hasMultipleEntries = result.length > 1;
        const hasSingleEntryWithAmount = result.length === 1 && result[0].amount > 0;

        if (!hasMultipleEntries && !hasSingleEntryWithAmount) {
            return;
        }

        const categoryTotalAmount = sumEntryAmounts(result);
        const totalAmount = transactionType === TransactionTypeEnum.EXPENSE ? categoryTotalAmount + feeTotal : categoryTotalAmount;

        setValue('entries', [...result, ...currentFeeEntries], { shouldValidate: false });
        setValue('amount', totalAmount);
        setFromNumeric(totalAmount);
    };

    const handleSplitPress = async () => {
        const currentEntries = getValues('entries');
        const currentCategoryEntries = getTransactionCategoryEntries(currentEntries);
        const currentFeeEntries = getTransactionFeeEntries(currentEntries);
        const feeTotal = sumEntryAmounts(currentFeeEntries);
        const currentAmount = getValues('amount');
        const accountId = getValues(accountFieldName) ?? 0;
        const splitAmount = transactionType === TransactionTypeEnum.EXPENSE ? Math.max(currentAmount - feeTotal, 0) : currentAmount;
        const result = await openSplitEntries({
            entries: buildInitialSplitEntries(currentCategoryEntries, accountId),
            variant,
            entryType,
            currencySymbol,
            totalAmount: splitAmount
        });

        if (isDefined(result)) {
            applySplitResult(result, currentFeeEntries, feeTotal);
        }
    };

    const applyFeeResult = (
        result: TransactionFeeModalResult,
        currentEntries: TransactionEntryCreateInputInterface[],
        currentFeeEntries: TransactionEntryCreateInputInterface[],
        accountId: number
    ) => {
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const nextFeeEntries = result.map(entry => ({ ...entry, accountId, type: TransactionEntryTypeEnum.FEE }));
        const previousFeeAmount = sumEntryAmounts(currentFeeEntries);
        const nextFeeAmount = sumEntryAmounts(nextFeeEntries);

        setValue('entries', [...categoryEntries, ...nextFeeEntries], { shouldValidate: false });

        if (transactionType === TransactionTypeEnum.EXPENSE) {
            const nextAmount = Math.max(getValues('amount') - previousFeeAmount + nextFeeAmount, 0);

            setValue('amount', nextAmount);
            setFromNumeric(nextAmount);
        }
    };

    const handleFeePress = async () => {
        const currentEntries = getValues('entries');
        const currentFeeEntries = getTransactionFeeEntries(currentEntries);
        const accountId = getValues(accountFieldName) ?? 0;
        const result = await openTransactionFee({
            accountId,
            currencySymbol,
            entry: currentFeeEntries.at(0) ?? null,
            variant
        });

        if (isDefined(result)) {
            applyFeeResult(result, currentEntries, currentFeeEntries, accountId);
        }
    };

    const isSplitActive = splitEntryCount > 1;
    const hasTagsSelected = isNotEmptyArray(tagIds);
    const isCategoryUserConfirmed = categorySource !== CategorySourceEnum.MCC_DEFAULT;

    const handleNormalConfirm = () => {
        const amount = getValues('amount');
        const currentEntries = getValues('entries');
        const accountId = getValues(accountFieldName) ?? 0;
        const categoryEntry = getTransactionCategoryEntries(currentEntries).at(0);
        const feeEntries = getTransactionFeeEntries(currentEntries).map(entry => ({ ...entry, accountId }));
        const feeTotal = sumEntryAmounts(feeEntries);
        const formCategoryId = categoryEntry?.categoryId ?? 0;
        const categoryAmount = transactionType === TransactionTypeEnum.EXPENSE ? amount - feeTotal : amount;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: categoryAmount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: formCategoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: accountId > 0, shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        const builtEntries = buildEntries({ accountId, categoryId: formCategoryId, amount: categoryAmount, mccCategoryId });

        setValue('entries', [...builtEntries, ...feeEntries], { shouldValidate: false });

        onSubmit();
    };

    const handleSplitConfirm = () => {
        const accountId = getValues(accountFieldName) ?? 0;
        const currentEntries = getValues('entries');
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const feeEntries = getTransactionFeeEntries(currentEntries).map(entry => ({ ...entry, accountId }));
        const allEntriesValid = categoryEntries.every(entry => entry.amount > 0 && isPositiveNumber(entry.categoryId));
        const categoryTotalAmount = sumEntryAmounts(categoryEntries);
        const totalAmount =
            transactionType === TransactionTypeEnum.EXPENSE ? categoryTotalAmount + sumEntryAmounts(feeEntries) : categoryTotalAmount;

        const isValid = validateAndShake([
            { isValid: categoryTotalAmount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: allEntriesValid },
            { isValid: accountId > 0, shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        setValue('entries', [...categoryEntries, ...feeEntries], { shouldValidate: false });
        setValue('amount', totalAmount);

        onSubmit();
    };

    const handleSplitIconPress = () => void handleSplitPress();
    const handleFeePillPress = () => void handleFeePress();
    const handleConfirm = isSplitActive ? handleSplitConfirm : handleNormalConfirm;
    const amountTopStack = (
        <View className="h-[76px] items-center justify-end gap-xs">
            <RulePillSlot
                ruleDetectionMode={ruleDetectionMode}
                suggestRuleData={suggestRuleData}
                updateRuleData={updateRuleData}
                matchingRulesCount={matchingRulesCount}
                matchingRuleIds={matchingRuleIds}
                onRuleCreated={onRuleCreated}
                onDismiss={onDismiss}
                onCreatingChange={onCreatingChange}
            />
            <View className="flex-row flex-wrap items-center justify-center gap-xs">
                {amountTopContent}
                <TransactionFeePill amount={feeAmount} currencySymbol={currencySymbol} showEmptyState onPress={handleFeePillPress} />
            </View>
        </View>
    );

    return (
        <View className="flex-1">
            <View className="flex-1">
                <View className="flex-1">
                    <TransactionAmountDisplay
                        ref={amountDisplayRef}
                        amount={displayValue}
                        currencySymbol={currencySymbol}
                        variant={variant}
                        topContent={amountTopStack}
                        testID={SimpleQuickFormSelector.AmountInput}
                    />
                </View>
                <QuickFormBottomOverlay
                    transactionTitle={transactionTitle}
                    mccCategoryId={mccCategoryId}
                    isNewTransaction={isNewTransaction}
                    isSplitActive={isSplitActive}
                    transactionType={transactionType}
                    categoryId={categoryId}
                    isCategoryUserConfirmed={isCategoryUserConfirmed}
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

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={transactionType}
                splitEntryCount={splitEntryCount}
                isAmountPositive={isAmountPositive}
                onSplitPress={handleSplitIconPress}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
                categoryTestID={SimpleQuickFormSelector.CategorySelector}
                tagsTestID={SimpleQuickFormSelector.TagsSelector}
                commentTestID={SimpleQuickFormSelector.CommentInput}
            />

            <View className="mb-xl">
                <TransactionAccountRow
                    ref={accountRowRef}
                    variant={variant}
                    fieldName={accountFieldName}
                    testID={SimpleQuickFormSelector.AccountSelector}
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
                confirmTestID={SimpleQuickFormSelector.SubmitButton}
            />
        </View>
    );
};
