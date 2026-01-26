import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { NotificationFeedbackType } from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useDatePickerModal } from '../../context/date-picker-modal.context';
import { useNoteInputModal } from '../../context/note-input-modal.context';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { TransactionAccountRow } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons, TransactionFieldIconsRef } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import {
    TransactionTransferAccountsRow,
    TransactionTransferAccountsRowRef
} from '../transaction-transfer-accounts-row/transaction-transfer-accounts-row';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly onSubmit: () => void;
}

const MICRO_UNIT = 1_000_000;

// eslint-disable-next-line max-statements, max-lines-per-function -- Component orchestrates multiple form fields, modals, and keypad state
export const TransactionQuickForm = ({ variant, transactionType, onSubmit }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues, trigger } = useFormContext<TransactionCreateInputInterface>();
    const { openDatePicker } = useDatePickerModal();
    const { openNoteInput } = useNoteInputModal();
    const [hapticNotification] = useVibration();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const initialAmount = getValues('amount') / MICRO_UNIT;
    const { displayValue, numericValue, handleDigit, handleDecimal, handleBackspace, handleClear } = useKeypadInput(initialAmount);

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

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

    const handleCommentPress = async () => {
        const result = await openNoteInput({ initialValue: comment });

        if (isDefined(result)) {
            setValue('comment', result);
        }
    };

    const handleDatePress = async () => {
        const result = await openDatePicker({ initialDate: operatedAt });

        if (isDefined(result)) {
            setValue('operatedAt', result);
        }
    };

    const isTransfer = transactionType === TransactionTypeEnum.TRANSFER;

    const triggerValidationShakes = (hasValidAmount: boolean, hasCategory: boolean, hasFromAccount: boolean, hasToAccount: boolean) => {
        if (!hasValidAmount) {amountDisplayRef.current?.shake();}
        if (!hasCategory) {fieldIconsRef.current?.shakeCategory();}
        if (!hasFromAccount) {transferAccountsRef.current?.shakeFrom();}
        if (!hasToAccount) {transferAccountsRef.current?.shakeTo();}
    };

    const handleConfirm = async () => {
        const amount = getValues('amount');
        const entries = getValues('entries');
        const toAccountId = getValues('toAccountId');
        const hasValidAmount = amount > 0;
        const hasCategory = isTransfer || (entries[0]?.categoryId ?? 0) > 0;
        const hasFromAccount = (fromAccountId ?? 0) > 0;
        const hasToAccount = !isTransfer || (toAccountId ?? 0) > 0;

        if (!hasValidAmount || !hasCategory || !hasFromAccount || !hasToAccount) {
            hapticNotification(NotificationFeedbackType.Error);
            triggerValidationShakes(hasValidAmount, hasCategory, hasFromAccount, hasToAccount);

            return;
        }

        const isValid = await trigger();

        if (isValid) {
            onSubmit();
        }
    };

    return (
        <View className="flex-1">
            <TransactionAmountDisplay ref={amountDisplayRef} amount={displayValue} currencySymbol={currencySymbol} variant={variant} />

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={transactionType}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="gap-md mb-lg">
                {isTransfer ? (
                    <TransactionTransferAccountsRow ref={transferAccountsRef} variant={variant} />
                ) : (
                    <TransactionAccountRow variant={variant} fieldName="fromAccountId" />
                )}
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={handleDigit}
                onDecimal={handleDecimal}
                onBackspace={handleBackspace}
                onLongBackspace={handleClear}
                onConfirm={handleConfirm}
            />
        </View>
    );
};
