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

    const hasInitializedWithStoredAmount = useRef(false);
    const previousInstrumentPair = useRef<string>('');

    // eslint-disable-next-line max-statements -- Effect handles initialization and conversion logic with multiple conditions
    useEffect(() => {
        const isCrossCurrency = fromInstrumentId !== toInstrumentId && fromInstrumentId > 0 && toInstrumentId > 0;
        const instrumentPair = `${fromInstrumentId}-${toInstrumentId}`;
        const instrumentsChanged = instrumentPair !== previousInstrumentPair.current;

        if (!isCrossCurrency) {
            conversion.reset();
            previousInstrumentPair.current = instrumentPair;

            return;
        }

        const hasStoredAmount = isPositiveNumber(initialDestinationAmount);
        const shouldInitializeWithStored = hasStoredAmount && !hasInitializedWithStoredAmount.current;

        if (shouldInitializeWithStored) {
            conversion.setManualDestinationAmount(sourceKeypad.numericValue, initialDestinationAmount);
            hasInitializedWithStoredAmount.current = true;
            previousInstrumentPair.current = instrumentPair;

            return;
        }

        const shouldRecalculate = instrumentsChanged || !conversion.isManualRate;

        if (shouldRecalculate) {
            conversion.convert(sourceKeypad.numericValue, fromInstrumentId, toInstrumentId);
        }

        previousInstrumentPair.current = instrumentPair;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Controlled dependencies for conversion logic
    }, [sourceKeypad.numericValue, fromInstrumentId, toInstrumentId, initialDestinationAmount]);

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
