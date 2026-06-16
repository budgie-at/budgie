import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, useRef } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormSplit } from '../../hook/use-quick-form-split.hook';
import { useQuickFormSubmit } from '../../hook/use-quick-form-submit.hook';
import { useSimpleQuickFormState } from '../../hook/use-simple-quick-form-state.hook';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { SimpleQuickFormDisplay } from '../simple-quick-form-display/simple-quick-form-display';

import type { QuickFormAccountFieldName } from '../../interface/quick-form-account-field-name.type';
import type { QuickFormBuildEntryParamsInterface } from '../../interface/quick-form-build-entry-params.interface';
import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';
import type { TransactionFieldIconsRefInterface } from '../../interface/transaction-field-icons-ref.interface';
import type { TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import type { TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
    readonly amountTopContent?: ReactNode;
    readonly buildEntries: (params: QuickFormBuildEntryParamsInterface) => TransactionEntryCreateInputInterface[];
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
    readonly rulePillSlotProps?: RulePillSlotPropsInterface;
}

const EXPENSE_ENTRY_TYPE = TransactionEntryTypeEnum.CREDIT;
const INCOME_ENTRY_TYPE = TransactionEntryTypeEnum.DEBIT;

const getEntryTypeForTransaction = (transactionType: TransactionTypeEnum): TransactionEntryTypeEnum =>
    transactionType === TransactionTypeEnum.EXPENSE ? EXPENSE_ENTRY_TYPE : INCOME_ENTRY_TYPE;

export const SimpleQuickForm = (props: Props) => {
    const { rulePillSlotProps, ...formProps } = props;
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { displayValue, currencySymbol, keypadHandlers, setFromNumeric } = useQuickFormAmount({
        accountFieldName: props.accountFieldName
    });
    const formState = useSimpleQuickFormState({ accountFieldName: props.accountFieldName, setFromNumeric });

    const entryType = getEntryTypeForTransaction(props.transactionType);
    const isSplitActive = formState.splitEntryCount > 1;
    const { feeAmount, handleFeePillPress } = useQuickFormFee({
        accountFieldName: props.accountFieldName,
        currencySymbol,
        entries: formState.entries,
        transactionType: props.transactionType,
        variant: props.variant,
        setFromNumeric
    });
    const { handleSplitIconPress } = useQuickFormSplit({
        accountFieldName: props.accountFieldName,
        currencySymbol,
        entryType,
        transactionType: props.transactionType,
        variant: props.variant,
        setFromNumeric
    });

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRefInterface>(null);
    const accountRowRef = useRef<TransactionAccountRowRef>(null);

    const { handleConfirm } = useQuickFormSubmit({
        accountFieldName: props.accountFieldName,
        amountDisplayRef,
        fieldIconsRef,
        accountRowRef,
        buildEntries: props.buildEntries,
        isSplitActive,
        mccCategoryId: props.mccCategoryId,
        transactionType: props.transactionType,
        onSubmit: props.onSubmit
    });

    return (
        <View className="flex-1">
            <SimpleQuickFormDisplay
                {...formProps}
                {...rulePillSlotProps}
                amountDisplayRef={amountDisplayRef}
                currencySymbol={currencySymbol}
                displayValue={displayValue}
                feeAmount={feeAmount}
                categoryId={formState.categoryId}
                isCategoryUserConfirmed={formState.isCategoryUserConfirmed}
                comment={formState.comment}
                accountId={formState.accountId}
                amount={formState.amount}
                hasTagsSelected={formState.hasTagsSelected}
                isSplitActive={isSplitActive}
                onSelectCategory={formState.handleSelectCategory}
                onSelectTag={formState.handleSelectTag}
                onSelectComment={formState.handleSelectComment}
                onFillPatternAmount={formState.handleFillPatternAmount}
                onFeePress={handleFeePillPress}
            />

            <SimpleQuickFormControls
                {...formProps}
                {...rulePillSlotProps}
                accountRowRef={accountRowRef}
                fieldIconsRef={fieldIconsRef}
                splitEntryCount={formState.splitEntryCount}
                isAmountPositive={formState.isAmountPositive}
                keypadHandlers={keypadHandlers}
                onCommentPress={handleCommentPress}
                onConfirm={handleConfirm}
                onDatePress={handleDatePress}
                onSplitPress={handleSplitIconPress}
            />
        </View>
    );
};
