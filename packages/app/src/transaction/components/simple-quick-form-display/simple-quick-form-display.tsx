import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { QuickFormBottomOverlay } from '../quick-form-bottom-overlay/quick-form-bottom-overlay';
import { SimpleQuickFormAmountHeader } from '../simple-quick-form-amount-header/simple-quick-form-amount-header';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
    readonly accountId: number;
    readonly aiContext?: string;
    readonly amount: number;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly amountBottomContent?: ReactNode;
    readonly amountTopContent?: ReactNode;
    readonly categoryId: number | null;
    readonly comment: string;
    readonly currencySymbol: string;
    readonly displayValue: string;
    readonly hasTagsSelected: boolean;
    readonly isCategoryUserConfirmed: boolean;
    readonly isNewTransaction?: boolean;
    readonly isSplitActive: boolean;
    readonly mccCategoryId: number | null;
    readonly transactionTitle: string;
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly onFillPatternAmount: (patternAmount: number) => void;
    readonly onSelectCategory: (selectedCategoryId: number) => void;
    readonly onSelectComment: (selectedComment: string) => void;
    readonly onSelectTag: (selectedTagId: number) => void;
}

export const SimpleQuickFormDisplay = ({
    accountId,
    aiContext = '',
    amount,
    amountBottomContent,
    amountDisplayRef,
    amountTopContent,
    categoryId,
    comment,
    currencySymbol,
    displayValue,
    hasTagsSelected,
    isCategoryUserConfirmed,
    isNewTransaction = false,
    isSplitActive,
    mccCategoryId,
    transactionTitle,
    transactionType,
    variant,
    ruleDetection,
    onSelectCategory,
    onSelectTag,
    onSelectComment,
    onFillPatternAmount
}: Props) => (
    <View className="flex-1">
        <View className="flex-1">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={displayValue}
                currencySymbol={currencySymbol}
                variant={variant}
                bottomContent={amountBottomContent}
                topContent={<SimpleQuickFormAmountHeader amountTopContent={amountTopContent} ruleDetection={ruleDetection} />}
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
