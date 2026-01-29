import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { SystemCategoryIdEnum } from '../../../category/enum/system-category-id.enum';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCurrencyConversion } from '../../hook/use-currency-conversion.hook';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { buildTransferEntries } from '../../utils/build-transfer-entries.util';
import { ConversionRow } from '../conversion-row/conversion-row';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import {
    TransactionTransferAccountsRow,
    TransactionTransferAccountsRowRef
} from '../transaction-transfer-accounts-row/transaction-transfer-accounts-row';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function, complexity -- Transfer form with dual keypad and cross-currency conversion
export const TransferQuickForm = ({ variant, onSubmit, onCancel }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { fromAccountId, toAccountId, fromAccount, toAccount } = useTransferAccounts();

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const [isEditingDestination, setIsEditingDestination] = useState(false);

    const initialAmount = getValues('amount');
    const conversion = useCurrencyConversion();

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

        if (isPositiveNumber(destinationAmount)) {
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

    const handleConfirm = () => {
        if (isEditingDestination) {
            finishDestinationEditing();

            return;
        }

        const amount = getValues('amount');
        const from = fromAccountId ?? 0;
        const to = toAccountId ?? 0;

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
                isLabelFlipped={isEditingDestination}
                {...(conversion.isCrossCurrency && {
                    onLabelPress: handleConversionRowPress,
                    onSecondaryAmountPress: handleConversionRowPress
                })}
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
