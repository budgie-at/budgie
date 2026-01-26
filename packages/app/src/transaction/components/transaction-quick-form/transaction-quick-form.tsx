import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
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

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly onSubmit: () => void;
}

const MICRO_UNIT = 1_000_000;

// eslint-disable-next-line max-statements -- Component orchestrates multiple form fields, modals, and keypad state
export const TransactionQuickForm = ({ variant, transactionType, onSubmit }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues, trigger } = useFormContext<TransactionCreateInputInterface>();
    const { openDatePicker } = useDatePickerModal();
    const { openNoteInput } = useNoteInputModal();
    const [hapticNotification] = useVibration();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRef>(null);

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

    const handleConfirm = async () => {
        const amount = getValues('amount');
        const entries = getValues('entries');
        const hasValidAmount = amount > 0;
        const hasCategory = (entries[0]?.categoryId ?? 0) > 0;

        if (!hasValidAmount || !hasCategory) {
            hapticNotification(NotificationFeedbackType.Error);

            if (!hasValidAmount) {
                amountDisplayRef.current?.shake();
            }

            if (!hasCategory) {
                fieldIconsRef.current?.shakeCategory();
            }

            return;
        }

        const isValid = await trigger();

        if (!isValid) {
            return;
        }

        onSubmit();
    };

    const isTransfer = transactionType === TransactionTypeEnum.TRANSFER;
    const fromAccountLabel = isTransfer ? t`From` : void 0;

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
                <TransactionAccountRow variant={variant} fieldName="fromAccountId" label={fromAccountLabel} />

                {isTransfer ? <TransactionAccountRow variant={variant} fieldName="toAccountId" label={t`To`} /> : null}
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
