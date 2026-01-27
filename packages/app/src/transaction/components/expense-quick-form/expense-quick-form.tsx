/* jscpd:ignore-start */
import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useCallback, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useDatePickerModal } from '../../context/date-picker-modal.context';
import { useNoteInputModal } from '../../context/note-input-modal.context';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { TransactionAccountRow } from '../transaction-account-row/transaction-account-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons, TransactionFieldIconsRef } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
/* jscpd:ignore-end */

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: () => void;
}

/* jscpd:ignore-start */
// eslint-disable-next-line max-statements -- Form component orchestrates multiple hooks, modals, and handlers
export const ExpenseQuickForm = ({ variant, onSubmit }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { openDatePicker } = useDatePickerModal();
    const { openNoteInput } = useNoteInputModal();
    const { validateAndShake } = useQuickFormValidation();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const fieldIconsRef = useRef<TransactionFieldIconsRef>(null);

    const initialAmount = getValues('amount');

    const handleAmountChange = useCallback(
        (value: number) => {
            setValue('amount', value);
        },
        [setValue]
    );

    const { displayValue, handleDigit, handleDecimal, handleBackspace, handleClear } = useKeypadInput({
        initialValue: initialAmount,
        onChange: handleAmountChange
    });

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const currencySymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

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

    const handleConfirm = () => {
        const amount = getValues('amount');
        const categoryId = getValues('entries.0.categoryId') ?? 0;
        const accountId = getValues('fromAccountId') ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: categoryId > 0, shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: accountId > 0 }
        ]);

        if (!isValid) {
            return;
        }

        const entries = buildExpenseEntry({ accountId, categoryId, amount });

        setValue('entries', entries, { shouldValidate: false });

        onSubmit();
    };

    return (
        <View className="flex-1">
            <TransactionAmountDisplay ref={amountDisplayRef} amount={displayValue} currencySymbol={currencySymbol} variant={variant} />

            <TransactionFieldIcons
                ref={fieldIconsRef}
                variant={variant}
                transactionType={TransactionTypeEnum.EXPENSE}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionAccountRow variant={variant} fieldName="fromAccountId" />
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
/* jscpd:ignore-end */
