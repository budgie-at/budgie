import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { TransactionAccountRow } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionCommentInput } from '../transaction-comment-input/transaction-comment-input';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionFormDatePicker } from '../transaction-form-date-picker/transaction-form-date-picker';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly onSubmit: () => void;
}

const MICRO_UNIT = 1_000_000;

// eslint-disable-next-line max-statements -- Component orchestrates multiple form fields, bottom sheets, and keypad state
export const TransactionQuickForm = ({ variant, transactionType, onSubmit }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();

    const commentSheetRef = useRef<BottomSheetInterface | null>(null);
    const dateSheetRef = useRef<BottomSheetInterface | null>(null);

    const initialAmount = getValues('amount') / MICRO_UNIT;
    const { displayValue, numericValue, handleDigit, handleDecimal, handleDoubleZero, handleBackspace, handleClear } =
        useKeypadInput(initialAmount);

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const currencySymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    useEffect(() => {
        const microAmount = Math.round(numericValue * MICRO_UNIT);
        setValue('amount', microAmount);

        const entries = getValues('entries');

        if (entries.length === 1) {
            setValue('entries.0.amount', microAmount);
        }
    }, [numericValue, setValue, getValues]);

    const handleCommentPress = () => {
        commentSheetRef.current?.open();
    };

    const handleDatePress = () => {
        dateSheetRef.current?.open();
    };

    const handleCommentClose = () => {
        commentSheetRef.current?.dismiss();
    };

    const handleDateClose = () => {
        dateSheetRef.current?.dismiss();
    };

    const handleConfirm = () => {
        if (!isPositiveNumber(numericValue)) {
            return;
        }

        onSubmit();
    };

    const isTransfer = transactionType === TransactionTypeEnum.TRANSFER;
    const fromAccountLabel = isTransfer ? t`From` : void 0;

    return (
        <View className="flex-1">
            <TransactionAmountDisplay amount={displayValue} currencySymbol={currencySymbol} variant={variant} />

            <TransactionFieldIcons
                variant={variant}
                transactionType={transactionType}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="gap-md mb-lg">
                <TransactionAccountRow variant={variant} fieldName="fromAccountId" label={fromAccountLabel} />

                {isTransfer ? <TransactionAccountRow variant={variant} fieldName="toAccountId" label={t`To`} /> : null}
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={handleDigit}
                onDecimal={handleDecimal}
                onDoubleZero={handleDoubleZero}
                onBackspace={handleBackspace}
                onLongBackspace={handleClear}
                onConfirm={handleConfirm}
                isConfirmDisabled={!isPositiveNumber(numericValue)}
            />

            <BottomSheet ref={commentSheetRef} enableDynamicSizing>
                <TransactionCommentInput onClose={handleCommentClose} />
            </BottomSheet>

            <BottomSheet ref={dateSheetRef} enableDynamicSizing>
                <TransactionFormDatePicker variant={variant} onClose={handleDateClose} />
            </BottomSheet>
        </View>
    );
};
