/* jscpd:ignore-start */
import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useDatePickerModal } from '../../context/date-picker-modal.context';
import { useNoteInputModal } from '../../context/note-input-modal.context';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { buildTransferEntries } from '../../utils/build-transfer-entries.util';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import {
    TransactionTransferAccountsRow,
    TransactionTransferAccountsRowRef
} from '../transaction-transfer-accounts-row/transaction-transfer-accounts-row';
/* jscpd:ignore-end */

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

/* jscpd:ignore-start */
// eslint-disable-next-line max-statements -- Form component orchestrates multiple hooks, modals, and handlers
export const TransferQuickForm = ({ variant, onSubmit, onCancel }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { openDatePicker } = useDatePickerModal();
    const { openNoteInput } = useNoteInputModal();
    const { validateAndShake } = useQuickFormValidation();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const initialAmount = getValues('amount');

    const handleAmountChange = (value: number) => {
        setValue('amount', value);
    };

    const { displayValue, handleDigit, handleDecimal, handleBackspace, handleClear } = useKeypadInput({
        initialValue: initialAmount,
        onChange: handleAmountChange
    });

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const currencySymbol = fromAccount?.instrument.symbol ?? defaultInstrument.symbol;

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
        const from = getValues('fromAccountId') ?? 0;
        const to = getValues('toAccountId') ?? 0;

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: from > 0, shake: () => transferAccountsRef.current?.shakeFrom() },
            { isValid: to > 0, shake: () => transferAccountsRef.current?.shakeTo() }
        ]);

        if (!isValid) {
            return;
        }

        const entries = buildTransferEntries({
            fromAccountId: from,
            toAccountId: to,
            amount,
            categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER
        });

        setValue('entries', entries, { shouldValidate: false });

        onSubmit();
    };

    return (
        <View className="flex-1">
            <TransactionAmountDisplay ref={amountDisplayRef} amount={displayValue} currencySymbol={currencySymbol} variant={variant} />

            <TransactionFieldIcons
                variant={variant}
                transactionType={TransactionTypeEnum.TRANSFER}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionTransferAccountsRow ref={transferAccountsRef} variant={variant} />
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={handleDigit}
                onDecimal={handleDecimal}
                onBackspace={handleBackspace}
                onLongBackspace={handleClear}
                onConfirm={handleConfirm}
                onCancel={onCancel}
            />
        </View>
    );
};
/* jscpd:ignore-end */
