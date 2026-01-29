import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { useCurrencyConversion } from './use-currency-conversion.hook';
import { useKeypadInput } from './use-keypad-input.hook';

import type { UseKeypadInputResult } from './use-keypad-input.hook';

interface UseTransferKeypadConfig {
    readonly fromInstrumentId: number;
    readonly toInstrumentId: number;
    readonly initialDestinationAmount?: number;
}

interface UseTransferKeypadResult {
    readonly sourceKeypad: UseKeypadInputResult;
    readonly destinationKeypad: UseKeypadInputResult;
    readonly activeKeypad: UseKeypadInputResult;
    readonly activeHandlers: UseKeypadInputResult['handlers'];
    readonly isEditingDestination: boolean;
    readonly conversion: ReturnType<typeof useCurrencyConversion>;
    readonly finishDestinationEditing: () => void;
    readonly handleConversionRowPress: () => void;
}

 
export const useTransferKeypad = ({
    fromInstrumentId,
    toInstrumentId,
    initialDestinationAmount
}: UseTransferKeypadConfig): UseTransferKeypadResult => {
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
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
        initialValue: initialDestinationAmount ?? 0
    });

    const activeKeypad = isEditingDestination ? destinationKeypad : sourceKeypad;
    const activeHandlers = activeKeypad.handlers;

    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (fromInstrumentId === toInstrumentId || fromInstrumentId === 0 || toInstrumentId === 0) {
            return;
        }

        const hasStoredDestination = isPositiveNumber(initialDestinationAmount) && initialDestinationAmount !== initialAmount;

        if (hasStoredDestination && !hasInitializedRef.current) {
            conversion.setManualDestinationAmount(sourceKeypad.numericValue, initialDestinationAmount);
            hasInitializedRef.current = true;

            return;
        }

        conversion.convert(sourceKeypad.numericValue, fromInstrumentId, toInstrumentId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- conversion methods are stable, only trigger on value/instrument changes
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

    return {
        sourceKeypad,
        destinationKeypad,
        activeKeypad,
        activeHandlers,
        isEditingDestination,
        conversion,
        finishDestinationEditing,
        handleConversionRowPress
    };
};
