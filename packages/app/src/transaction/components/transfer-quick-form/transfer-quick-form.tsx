/* jscpd:ignore-start */
import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useDatePickerModal } from '../../context/date-picker-modal.context';
import { useNoteInputModal } from '../../context/note-input-modal.context';
import { useCurrencyConversion } from '../../hook/use-currency-conversion.hook';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { buildTransferEntries } from '../../utils/build-transfer-entries.util';
import { ConversionRow } from '../conversion-row/conversion-row';
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
// eslint-disable-next-line max-statements, max-lines-per-function, complexity -- Form component orchestrates multiple hooks, modals, and handlers
export const TransferQuickForm = ({ variant, onSubmit, onCancel }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { openDatePicker } = useDatePickerModal();
    const { openNoteInput } = useNoteInputModal();
    const { validateAndShake } = useQuickFormValidation();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const [isEditingDestination, setIsEditingDestination] = useState(false);

    const initialAmount = getValues('amount');
    const conversion = useCurrencyConversion();

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const toAccountId = useWatch({ control, name: 'toAccountId' });
    const operatedAt = useWatch({ control, name: 'operatedAt' });
    const comment = useWatch({ control, name: 'comment' });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { account: toAccount } = useGetAccountByIdQuery(toAccountId ?? 0);

    const handleSourceAmountChange = (value: number) => {
        setValue('amount', value);
    };

    const sourceKeypad = useKeypadInput({
        initialValue: initialAmount,
        onChange: handleSourceAmountChange
    });

    const destinationKeypad = useKeypadInput({
        initialValue: 0
    });

    const activeKeypad = isEditingDestination ? destinationKeypad : sourceKeypad;

    const displayAmount = isEditingDestination ? destinationKeypad.displayValue : sourceKeypad.displayValue;
    const displaySymbol = isEditingDestination
        ? (toAccount?.instrument.symbol ?? defaultInstrument.symbol)
        : (fromAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const fromCode = fromAccount?.instrument.code ?? '';
    const toCode = toAccount?.instrument.code ?? '';
    const hasAccountCodes = fromCode.length > 0 && toCode.length > 0;
    const editingLabel = isEditingDestination ? t`Receiving ${toCode}` : t`Sending ${fromCode}`;
    const amountLabel = conversion.isCrossCurrency && hasAccountCodes ? editingLabel : null;

    const secondarySymbol = isEditingDestination
        ? (fromAccount?.instrument.symbol ?? defaultInstrument.symbol)
        : (toAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const secondaryValue = isEditingDestination ? sourceKeypad.numericValue : conversion.destinationAmount;
    const secondaryPrefix = isEditingDestination ? '' : '\u2248 ';
    const formattedSecondaryValue = secondaryValue > 0 ? secondaryValue.toFixed(2) : '0.00';
    const secondaryAmountText = conversion.isCrossCurrency ? `${secondaryPrefix}${secondarySymbol} ${formattedSecondaryValue}` : null;

    const conversionRowAmount = isEditingDestination ? sourceKeypad.numericValue : conversion.destinationAmount;
    const conversionRowSymbol = isEditingDestination
        ? (fromAccount?.instrument.symbol ?? defaultInstrument.symbol)
        : (toAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const conversionRowSourceCode = isEditingDestination ? (toAccount?.instrument.code ?? '') : (fromAccount?.instrument.code ?? '');
    const conversionRowDestCode = isEditingDestination ? (fromAccount?.instrument.code ?? '') : (toAccount?.instrument.code ?? '');
    const conversionRowRate = !isEditingDestination && conversion.exchangeRate > 0 ? 1 / conversion.exchangeRate : conversion.exchangeRate;

    const fromInstrumentId = fromAccount?.instrumentId ?? 0;
    const toInstrumentId = toAccount?.instrumentId ?? 0;

    useEffect(() => {
        conversion.convert(sourceKeypad.numericValue, fromInstrumentId, toInstrumentId);
    }, [sourceKeypad.numericValue, fromInstrumentId, toInstrumentId]);

    const finishDestinationEditing = () => {
        const destinationAmount = destinationKeypad.numericValue;

        if (destinationAmount > 0) {
            conversion.setManualDestinationAmount(sourceKeypad.numericValue, destinationAmount);
        }

        setIsEditingDestination(false);
    };

    const handleConversionRowPress = () => {
        if (isEditingDestination) {
            finishDestinationEditing();
        } else {
            destinationKeypad.setFromNumeric(conversion.destinationAmount);
            setIsEditingDestination(true);
        }
    };

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
        if (isEditingDestination) {
            finishDestinationEditing();

            return;
        }

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

        if (conversion.isCrossCurrency) {
            setValue('exchangeRate', conversion.exchangeRate);
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
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={displayAmount}
                currencySymbol={displaySymbol}
                variant={variant}
                secondaryAmount={secondaryAmountText}
                label={amountLabel}
                onSecondaryAmountPress={conversion.isCrossCurrency ? handleConversionRowPress : undefined}
            />

            <TransactionFieldIcons
                variant={variant}
                transactionType={TransactionTypeEnum.TRANSFER}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionTransferAccountsRow ref={transferAccountsRef} variant={variant} />
            </View>

            {conversion.isCrossCurrency ? (
                <View className="mb-sm">
                    <ConversionRow
                        destinationAmount={conversionRowAmount}
                        destinationSymbol={conversionRowSymbol}
                        sourceCode={conversionRowSourceCode}
                        destinationCode={conversionRowDestCode}
                        exchangeRate={conversionRowRate}
                        isManualRate={conversion.isManualRate}
                        onPress={handleConversionRowPress}
                    />
                </View>
            ) : null}

            <TransactionKeypad
                variant={variant}
                onDigit={activeKeypad.handleDigit}
                onDecimal={activeKeypad.handleDecimal}
                onBackspace={activeKeypad.handleBackspace}
                onLongBackspace={activeKeypad.handleClear}
                onConfirm={handleConfirm}
                onCancel={onCancel}
            />
        </View>
    );
};
/* jscpd:ignore-end */
