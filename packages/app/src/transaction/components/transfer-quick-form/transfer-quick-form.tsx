import { TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { buildTransferEntries, getTransactionFeeEntries } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCurrencyConversion } from '../../hook/use-currency-conversion.hook';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormValidation } from '../../hook/use-quick-form-validation.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { computeTransferDisplay } from '../../utils/compute-transfer-display.util';
import { ConversionRow } from '../conversion-row/conversion-row';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import {
    TransactionTransferAccountsRow,
    TransactionTransferAccountsRowRef
} from '../transaction-transfer-accounts-row/transaction-transfer-accounts-row';

import type { SimpleQuickFormRefInterface } from '../../interface/simple-quick-form-ref.interface';

interface Props {
    readonly ref?: Ref<SimpleQuickFormRefInterface>;
    readonly variant: ColorPaletteVariant;
    readonly initialDestinationAmount?: number;
    readonly isSubmitting?: boolean;
    readonly showInlineFeeAction?: boolean;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
    readonly onConsolidationPress?: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Transfer form orchestrates multiple hooks and display computations
export const TransferQuickForm = (props: Props) => {
    const {
        ref,
        variant,
        initialDestinationAmount,
        isSubmitting,
        showInlineFeeAction = true,
        onSubmit,
        onCancel,
        onConsolidationPress
    } = props;

    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const { fromAccountId, toAccountId, fromAccount, toAccount } = useTransferAccounts();

    const [isEditingDestination, setIsEditingDestination] = useState(false);

    const initialAmount = getValues('amount');
    const conversion = useCurrencyConversion();
    const entries = useWatch({ control, name: 'entries' });

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

    const activeKeypad = isEditingDestination ? destinationKeypad : sourceKeypad;

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
        // oxlint-disable-next-line react/exhaustive-deps -- conversion methods are stable, only trigger on value/instrument changes
    }, [sourceKeypad.numericValue, fromInstrumentId, toInstrumentId]);

    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const transferAccountsRef = useRef<TransactionTransferAccountsRowRef>(null);

    const fromCode = fromAccount?.instrument.code ?? '';
    const toCode = toAccount?.instrument.code ?? '';
    const feeCurrencySymbol = fromAccount?.instrument.symbol ?? defaultInstrument.symbol;
    const feeInstrumentType = fromAccount?.instrument.type ?? defaultInstrument.type;

    const { feeAmount, handleFeePress } = useQuickFormFee({
        accountFieldName: 'fromAccountId',
        currencySymbol: feeCurrencySymbol,
        entries,
        transactionType: TransactionTypeEnum.TRANSFER,
        variant
    });

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

    useImperativeHandle(ref, () => ({ openFee: handleFeePress }));
    const amountBottomContent = showInlineFeeAction ? (
        <TransactionFeePill
            amount={feeAmount}
            currencySymbol={feeCurrencySymbol}
            instrumentType={feeInstrumentType}
            showEmptyState
            onPress={handleFeePress}
        />
    ) : null;

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

        const transferEntries = buildTransferEntries({
            fromAccountId: from,
            toAccountId: to,
            amount
        });
        const feeEntries = getTransactionFeeEntries(getValues('entries')).map(entry => ({
            ...entry,
            accountId: from,
            type: TransactionEntryTypeEnum.FEE
        }));

        setValue('entries', [...transferEntries, ...feeEntries], { shouldValidate: false });

        onSubmit();
    };

    return (
        <View className="flex-1">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={display.displayAmount}
                currencySymbol={display.displaySymbol}
                variant={variant}
                secondaryAmount={display.secondaryAmountText}
                label={display.amountLabel}
                bottomContent={amountBottomContent}
                isLabelFlipped={isEditingDestination}
                testID={SimpleQuickFormSelector.AmountInput}
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
                onConsolidationPress={onConsolidationPress}
                commentTestID={SimpleQuickFormSelector.CommentInput}
            />

            <View className="mb-xl gap-sm">
                <TransactionTransferAccountsRow ref={transferAccountsRef} variant={variant} />
            </View>

            {conversion.isCrossCurrency ? (
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
                keypad={activeKeypad.handlers}
                onConfirm={handleConfirm}
                onCancel={onCancel}
                confirmTestID={SimpleQuickFormSelector.SubmitButton}
                isConfirmDisabled={isSubmitting}
            />
        </View>
    );
};
