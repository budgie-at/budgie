import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { QuickFormBottomOverlay } from '../quick-form-bottom-overlay/quick-form-bottom-overlay';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { SimpleQuickFormAmountHeader } from '../simple-quick-form-amount-header/simple-quick-form-amount-header';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';

interface Props extends RulePillSlotPropsInterface {
    readonly accountId: number;
    readonly aiContext?: string;
    readonly amount: number;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly amountTopContent?: ReactNode;
    readonly categoryId: number | null;
    readonly comment: string;
    readonly currencySymbol: string;
    readonly displayValue: string;
    readonly feeAmount: number;
    readonly hasTagsSelected: boolean;
    readonly isCategoryUserConfirmed: boolean;
    readonly isNewTransaction?: boolean;
    readonly isSplitActive: boolean;
    readonly mccCategoryId: number | null;
    readonly transactionTitle: string;
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly onFeePress: () => void;
    readonly onFillPatternAmount: (patternAmount: number) => void;
    readonly onSelectCategory: (selectedCategoryId: number) => void;
    readonly onSelectComment: (selectedComment: string) => void;
    readonly onSelectTag: (selectedTagId: number) => void;
}

export const SimpleQuickFormDisplay = ({
    accountId,
    aiContext = '',
    amount,
    amountDisplayRef,
    amountTopContent,
    categoryId,
    comment,
    currencySymbol,
    displayValue,
    feeAmount,
    hasTagsSelected,
    isCategoryUserConfirmed,
    isNewTransaction = false,
    isSplitActive,
    mccCategoryId,
    transactionTitle,
    transactionType,
    variant,
    onFeePress,
    ruleDetectionMode,
    suggestRuleData,
    updateRuleData,
    matchingRulesCount,
    matchingRuleIds,
    onSelectCategory,
    onSelectTag,
    onSelectComment,
    onFillPatternAmount,
    onRuleCreated,
    onDismiss,
    onCreatingChange
}: Props) => (
    <View className="flex-1">
        <View className="flex-1">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={displayValue}
                currencySymbol={currencySymbol}
                variant={variant}
                topContent={
                    <SimpleQuickFormAmountHeader
                        amountTopContent={amountTopContent}
                        currencySymbol={currencySymbol}
                        feeAmount={feeAmount}
                        ruleDetectionMode={ruleDetectionMode}
                        suggestRuleData={suggestRuleData}
                        updateRuleData={updateRuleData}
                        matchingRulesCount={matchingRulesCount}
                        matchingRuleIds={matchingRuleIds}
                        onRuleCreated={onRuleCreated}
                        onDismiss={onDismiss}
                        onCreatingChange={onCreatingChange}
                        onFeePress={onFeePress}
                    />
                }
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
            onSelectCategory={onSelectCategory}
            onSelectTag={onSelectTag}
            onSelectComment={onSelectComment}
            onFillPatternAmount={onFillPatternAmount}
        />
    </View>
);
