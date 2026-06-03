import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { QuickFormBottomOverlay } from '../quick-form-bottom-overlay/quick-form-bottom-overlay';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { SimpleQuickFormAmountHeader } from '../simple-quick-form-amount-header/simple-quick-form-amount-header';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

import type { useSimpleQuickFormActions } from '../../hook/use-simple-quick-form-actions.hook';
import type { useSimpleQuickFormValues } from '../../hook/use-simple-quick-form-values.hook';
import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';

interface Props extends RulePillSlotPropsInterface {
    readonly aiContext?: string;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly amountTopContent?: ReactNode;
    readonly currencySymbol: string;
    readonly displayValue: string;
    readonly feeAmount: number;
    readonly formValues: ReturnType<typeof useSimpleQuickFormValues>;
    readonly isNewTransaction?: boolean;
    readonly isSplitActive: boolean;
    readonly mccCategoryId: number | null;
    readonly quickFormActions: ReturnType<typeof useSimpleQuickFormActions>;
    readonly transactionTitle: string;
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly onFeePress: () => void;
}

export const SimpleQuickFormDisplay = ({
    aiContext = '',
    amountDisplayRef,
    amountTopContent,
    currencySymbol,
    displayValue,
    feeAmount,
    formValues,
    isNewTransaction = false,
    isSplitActive,
    mccCategoryId,
    quickFormActions,
    transactionTitle,
    transactionType,
    variant,
    onFeePress,
    ruleDetectionMode,
    suggestRuleData,
    updateRuleData,
    matchingRulesCount,
    matchingRuleIds,
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
            categoryId={formValues.categoryId}
            isCategoryUserConfirmed={formValues.isCategoryUserConfirmed}
            comment={formValues.comment}
            aiContext={aiContext}
            accountId={formValues.accountId}
            amount={formValues.amount}
            hasTagsSelected={formValues.hasTagsSelected}
            onSelectCategory={quickFormActions.handleSelectCategory}
            onSelectTag={quickFormActions.handleSelectTag}
            onSelectComment={quickFormActions.handleSelectComment}
            onFillPatternAmount={quickFormActions.handleFillPatternAmount}
        />
    </View>
);
