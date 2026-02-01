/* eslint-disable max-lines -- Transfer form with split mode integration requires extended file length */
import { TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
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
import { useSplitEntries } from '../../hook/use-split-entries.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { buildTransferEntries } from '../../utils/build-transfer-entries.util';
import { computeTransferDisplay } from '../../utils/compute-transfer-display.util';
import { ConversionRow } from '../conversion-row/conversion-row';
import { SplitEntryList } from '../split-entry-list/split-entry-list';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import {
    TransactionTransferAccountsRow,
    TransactionTransferAccountsRowRef
} from '../transaction-transfer-accounts-row/transaction-transfer-accounts-row';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly initialDestinationAmount?: number;
    readonly initialSplitMode?: boolean;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Transfer form orchestrates multiple hooks and display computations
export const TransferQuickForm = (props: Props) => {
    const { variant, initialDestinationAmount, initialSplitMode = false, onSubmit, onCancel } = props;

    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { fromAccountId, toAccountId, fromAccount, toAccount } = useTransferAccounts();

    const [isEditingDestination, setIsEditingDestination] = useState(false);

    const initialAmount = getValues('amount');
    const conversion = useCurrencyConversion();

    // jscpd:ignore-start
    const split = useSplitEntries({ entryType: TransactionEntryTypeEnum.CREDIT, accountFieldName: 'fromAccountId', initialSplitMode });

    const splitKeypad = useKeypadInput({
        initialValue: 0,
        onChange: (value: number) => {
            split.updateEntryAmount(split.activeEntryIndex, value);
        }
    });

    const previousActiveEntryIndex = useRef(split.activeEntryIndex);

    useEffect(() => {
        if (previousActiveEntryIndex.current !== split.activeEntryIndex) {
            const entryAmount = split.entries[split.activeEntryIndex]?.amount ?? 0;
            splitKeypad.setFromNumeric(entryAmount);
            previousActiveEntryIndex.current = split.activeEntryIndex;
        }
    }, [split.activeEntryIndex, split.entries, splitKeypad]);
    // jscpd:ignore-end

    const handleSourceAmountChange = (value: number) => {
        setValue('amount', value);
    };

    const sourceKeypad = useKeypadInput({
        initialValue: initialAmount,
        onChange: handleSourceAmountChange
    });

    const destinationKeypad = useKeypadInput({
        initialValue: initialDestinationAmount ?? 0
    });

    const getActiveKeypad = () => {
        if (split.isSplitMode) {
            return splitKeypad;
        }

        if (isEditingDestination) {
            return destinationKeypad;
        }

        return sourceKeypad;
    };

    const activeKeypad = getActiveKeypad();
    const activeHandlers = activeKeypad.handlers;

    const fromInstrumentId = fromAccount?.instrumentId ?? 0;
    const toInstrumentId = toAccount?.instrumentId ?? 0;

    const hasInitializedRef = useRef(false);

    useEffect(() => {
        const isCrossCurrency = fromInstrumentId !== toInstrumentId && fromInstrumentId > 0 && toInstrumentId > 0;

        if (!isCrossCurrency) {
            return;
        }

        const hasStoredDestination = isPositiveNumber(initialDestinationAmount) && initialDestinationAmount !== initialAmount;

        if (hasStoredDestination && !hasInitializedRef.current) {
            conversion.setManualDestinationAmount(sourceKeypad.numericValue, initialDestinationAmount);
            hasInitializedRef.current = true;

            return;
        }

        if (hasInitializedRef.current && conversion.isManualRate) {
            return;
        }

        conversion.convert(sourceKeypad.numericValue, fromInstrumentId, toInstrumentId);
        hasInitializedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- conversion methods are stable, only trigger on value/instrument changes
    }, [sourceKeypad.numericValue, fromInstrumentId, toInstrumentId]);

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const fromCode = fromAccount?.instrument.code ?? '';
    const toCode = toAccount?.instrument.code ?? '';

    const display = computeTransferDisplay({
        isEditingDestination,
        sourceDisplayValue: sourceKeypad.displayValue,
        sourceNumericValue: sourceKeypad.numericValue,
        destinationDisplayValue: destinationKeypad.displayValue,
        fromAccount,
        toAccount,
        defaultSymbol: defaultInstrument.symbol,
        conversion,
        sendingLabel: t`Sending ${fromCode}`,
        receivingLabel: t`Receiving ${toCode}`
    });

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

    const handleSelectSplitEntry = (index: number) => {
        split.setActiveEntryIndex(index);
    };

    // jscpd:ignore-start
    const handleNormalConfirm = () => {
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

    const handleSplitConfirm = () => {
        const amount = getValues('amount');
        const from = fromAccountId ?? 0;
        const to = toAccountId ?? 0;

        const allEntriesValid = split.entries.every(entry => entry.amount > 0 && isPositiveNumber(entry.categoryId));

        const isValid = validateAndShake([
            { isValid: amount > 0, shake: () => amountDisplayRef.current?.shake() },
            { isValid: from > 0, shake: () => transferAccountsRef.current?.shakeFrom() },
            { isValid: to > 0, shake: () => transferAccountsRef.current?.shakeTo() },
            { isValid: allEntriesValid }
        ]);

        if (!isValid) {
            return;
        }

        if (conversion.isCrossCurrency) {
            setValue('exchangeRate', conversion.exchangeRate);
        }

        const transferEntries = buildTransferEntries({
            fromAccountId: from,
            toAccountId: to,
            amount,
            categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER
        });

        const feeEntries = split.entries;
        const totalAmount = amount + split.totalAmount;

        setValue('amount', totalAmount);
        setValue('entries', [...transferEntries, ...feeEntries], { shouldValidate: false });

        onSubmit();
    };

    // jscpd:ignore-end
    const handleConfirm = () => {
        if (split.isSplitMode) {
            handleSplitConfirm();

            return;
        }

        handleNormalConfirm();
    };

    const splitTotalDisplay = split.totalAmount === 0 ? '0' : split.totalAmount.toString();
    const activeDisplayAmount = split.isSplitMode ? splitTotalDisplay : display.displayAmount;
    const secondaryAmount = split.isSplitMode ? void 0 : display.secondaryAmountText;
    const amountLabel = split.isSplitMode ? void 0 : display.amountLabel;
    const labelFlipped = split.isSplitMode ? void 0 : isEditingDestination;
    const showCrossCurrencyControls = !split.isSplitMode && conversion.isCrossCurrency;

    return (
        <View className="flex-1">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={activeDisplayAmount}
                currencySymbol={display.displaySymbol}
                variant={variant}
                secondaryAmount={secondaryAmount}
                label={amountLabel}
                isLabelFlipped={labelFlipped}
                {...(showCrossCurrencyControls && {
                    onLabelPress: handleConversionRowPress,
                    onSecondaryAmountPress: handleConversionRowPress
                })}
            />

            {split.isSplitMode ? (
                <SplitEntryList
                    entries={split.entries}
                    activeEntryIndex={split.activeEntryIndex}
                    currencySymbol={display.displaySymbol}
                    onSelectEntry={handleSelectSplitEntry}
                    onAddEntry={split.addEntry}
                />
            ) : null}

            <TransactionFieldIcons
                variant={variant}
                transactionType={TransactionTypeEnum.TRANSFER}
                isSplitMode={split.isSplitMode}
                onToggleSplit={split.toggleSplitMode}
                onCommentPress={handleCommentPress}
                onDatePress={handleDatePress}
            />

            <View className="mb-xl">
                <TransactionTransferAccountsRow ref={transferAccountsRef} variant={variant} />
            </View>

            {showCrossCurrencyControls ? (
                <View className="mb-sm">
                    <ConversionRow
                        destinationAmount={display.conversionRowProps.destinationAmount}
                        destinationSymbol={display.conversionRowProps.destinationSymbol}
                        sourceCode={display.conversionRowProps.sourceCode}
                        destinationCode={display.conversionRowProps.destinationCode}
                        exchangeRate={display.conversionRowProps.exchangeRate}
                        isManualRate={conversion.isManualRate}
                        onPress={handleConversionRowPress}
                    />
                </View>
            ) : null}

            <TransactionKeypad
                variant={variant}
                onDigit={activeHandlers.onDigit}
                onDecimal={activeHandlers.onDecimal}
                onBackspace={activeHandlers.onBackspace}
                onLongBackspace={activeHandlers.onLongBackspace}
                onConfirm={handleConfirm}
                onCancel={onCancel}
            />
        </View>
    );
};
