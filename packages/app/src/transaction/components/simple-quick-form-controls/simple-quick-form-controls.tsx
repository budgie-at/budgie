import { TransactionTypeEnum } from '@budgie/contracts';
import { RefObject } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { QuickFormAccountFieldName } from '../../interface/quick-form-account-field-name.type';
import { TransactionFieldIconsRefInterface } from '../../interface/transaction-field-icons-ref.interface';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly accountRowRef: RefObject<TransactionAccountRowRef | null>;
    readonly feeAmount: number;
    readonly feeCurrencySymbol: string;
    readonly fieldIconsRef: RefObject<TransactionFieldIconsRefInterface | null>;
    readonly isAmountPositive: boolean;
    readonly keypadHandlers: {
        readonly onDigit: (digit: string) => void;
        readonly onDecimal: () => void;
        readonly onBackspace: () => void;
        readonly onLongBackspace: () => void;
    };
    readonly splitEntryCount: number;
    readonly showInlineFeeAction: boolean;
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly onCancel: () => void;
    readonly onCommentPress: () => void;
    readonly onConfirm: () => void;
    readonly onDatePress: () => void;
    readonly onFeePress: EmptyFn;
    readonly onSplitPress: () => void;
}

export const SimpleQuickFormControls = ({
    accountFieldName,
    accountRowRef,
    feeAmount,
    feeCurrencySymbol,
    fieldIconsRef,
    isAmountPositive,
    keypadHandlers,
    splitEntryCount,
    showInlineFeeAction,
    transactionType,
    variant,
    onCancel,
    onCommentPress,
    onConfirm,
    onDatePress,
    onFeePress,
    onSplitPress
}: Props) => (
    <>
        <TransactionFieldIcons
            ref={fieldIconsRef}
            variant={variant}
            transactionType={transactionType}
            splitEntryCount={splitEntryCount}
            isAmountPositive={isAmountPositive}
            onSplitPress={onSplitPress}
            onCommentPress={onCommentPress}
            onDatePress={onDatePress}
            categoryTestID={SimpleQuickFormSelector.CategorySelector}
            tagsTestID={SimpleQuickFormSelector.TagsSelector}
            commentTestID={SimpleQuickFormSelector.CommentInput}
            {...(showInlineFeeAction && { feeAmount, feeCurrencySymbol, onFeePress })}
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
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmTestID={SimpleQuickFormSelector.SubmitButton}
        />
    </>
);
