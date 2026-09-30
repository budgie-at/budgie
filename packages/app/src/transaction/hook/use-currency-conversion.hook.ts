import { PRECISION } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef, useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

interface ConversionState {
    readonly destinationAmount: number;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
}

interface UseCurrencyConversionResult {
    readonly isCrossCurrency: boolean;
    readonly destinationAmount: number;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly convert: (sourceAmount: number, sourceInstrumentId: number, destinationInstrumentId: number) => void;
    readonly setManualDestinationAmount: (sourceAmount: number, destinationAmount: number) => void;
    readonly reset: () => void;
}

const INITIAL_STATE: ConversionState = { destinationAmount: 0, exchangeRate: 1, isManualRate: false };

export const useCurrencyConversion = (): UseCurrencyConversionResult => {
    const [state, setState] = useState<ConversionState>(INITIAL_STATE);
    const [isCrossCurrency, setIsCrossCurrency] = useState(false);
    const conversionFiberRef = useRef<Fiber.Fiber<void> | null>(null);

    useEffect(() => () => conversionFiberRef.current?.interruptUnsafe(), []);

    const convert = (sourceAmount: number, sourceInstrumentId: number, destinationInstrumentId: number) => {
        if (sourceInstrumentId === destinationInstrumentId || sourceInstrumentId === 0 || destinationInstrumentId === 0) {
            setIsCrossCurrency(false);
            setState(INITIAL_STATE);

            return;
        }

        setIsCrossCurrency(true);

        if (!isPositiveNumber(sourceAmount)) {
            setState(previous => ({ ...previous, destinationAmount: 0, exchangeRate: previous.exchangeRate }));

            return;
        }

        conversionFiberRef.current?.interruptUnsafe();
        conversionFiberRef.current = appRuntime.runFork(
            exchangeRatesService.convert(sourceInstrumentId, destinationInstrumentId, convertToMicroUnits(sourceAmount)).pipe(
                Effect.map(
                    result =>
                        void setState({
                            destinationAmount: result.amount / PRECISION,
                            exchangeRate: result.exchangeRate,
                            isManualRate: false
                        })
                ),
                Effect.tapError(Effect.logError),
                Effect.ignore
            )
        );
    };

    const setManualDestinationAmount = (sourceAmount: number, destinationAmount: number) => {
        conversionFiberRef.current?.interruptUnsafe();
        const manualRate = isPositiveNumber(sourceAmount) && isPositiveNumber(destinationAmount) ? sourceAmount / destinationAmount : 1;

        setIsCrossCurrency(true);
        setState({ destinationAmount, exchangeRate: manualRate, isManualRate: true });
    };

    const reset = () => {
        setState(INITIAL_STATE);
        setIsCrossCurrency(false);
        conversionFiberRef.current?.interruptUnsafe();
    };

    return {
        isCrossCurrency,
        destinationAmount: state.destinationAmount,
        exchangeRate: state.exchangeRate,
        isManualRate: state.isManualRate,
        convert,
        setManualDestinationAmount,
        reset
    };
};
