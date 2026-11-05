import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { ExchangeRatesService } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';

interface ConversionState {
    readonly sourceKey: string;
    readonly destinationAmount: number;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
}

export interface UseCurrencyConversionResult {
    readonly isPending: boolean;
    readonly isCrossCurrency: boolean;
    readonly destinationAmount: number;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly convert: (sourceAmount: number, sourceInstrumentId: number, destinationInstrumentId: number) => void;
    readonly setManualDestinationAmount: (sourceAmount: number, destinationAmount: number) => void;
    readonly reset: () => void;
}

const INITIAL_STATE: ConversionState = { sourceKey: '', destinationAmount: 0, exchangeRate: 1, isManualRate: false };

export const useCurrencyConversion = (
    currentSourceInstrumentId: number,
    currentDestinationInstrumentId: number,
    currentSourceAmount: number
): UseCurrencyConversionResult => {
    const [state, setState] = useState<ConversionState>(INITIAL_STATE);
    const isCrossCurrency =
        currentSourceInstrumentId !== currentDestinationInstrumentId &&
        [currentSourceInstrumentId, currentDestinationInstrumentId].every(isPositiveNumber);
    const sourceKey = `${currentSourceInstrumentId}:${currentDestinationInstrumentId}:${currentSourceAmount}`;
    const conversionFiberRef = useRef<Fiber.Fiber<void> | null>(null);
    const instrumentPairRef = useRef<string | null>(null);

    useEffect(() => () => conversionFiberRef.current?.interruptUnsafe(), []);

    const convert = (sourceAmount: number, sourceInstrumentId: number, destinationInstrumentId: number) => {
        const hasChangedInstruments =
            isDefined(instrumentPairRef.current) && instrumentPairRef.current !== `${sourceInstrumentId}:${destinationInstrumentId}`;
        instrumentPairRef.current = `${sourceInstrumentId}:${destinationInstrumentId}`;
        conversionFiberRef.current?.interruptUnsafe();
        if (sourceInstrumentId === destinationInstrumentId || sourceInstrumentId === 0 || destinationInstrumentId === 0) {
            setState(INITIAL_STATE);

            return;
        }

        if (!isPositiveNumber(sourceAmount)) {
            setState(previous => ({
                ...previous,
                sourceKey,
                destinationAmount: 0,
                isManualRate: !hasChangedInstruments && previous.isManualRate
            }));

            return;
        }

        if (state.isManualRate && !hasChangedInstruments) {
            setState(previous => ({
                ...previous,
                sourceKey,
                destinationAmount: convertFromMicroUnits(Math.round(convertToMicroUnits(sourceAmount) / previous.exchangeRate))
            }));

            return;
        }

        conversionFiberRef.current = appRuntime.runFork(
            Effect.flatMap(ExchangeRatesService, exchangeRatesService =>
                exchangeRatesService.convert(sourceInstrumentId, destinationInstrumentId, convertToMicroUnits(sourceAmount))
            ).pipe(
                Effect.map(
                    result =>
                        void setState({
                            sourceKey,
                            destinationAmount: convertFromMicroUnits(result.amount),
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
        instrumentPairRef.current = `${currentSourceInstrumentId}:${currentDestinationInstrumentId}`;
        const manualRate = isPositiveNumber(sourceAmount) && isPositiveNumber(destinationAmount) ? sourceAmount / destinationAmount : 1;

        setState({ sourceKey, destinationAmount, exchangeRate: manualRate, isManualRate: true });
    };

    const reset = () => {
        setState(INITIAL_STATE);
        instrumentPairRef.current = null;
        conversionFiberRef.current?.interruptUnsafe();
    };

    return {
        isCrossCurrency,
        isPending: isCrossCurrency && state.sourceKey !== sourceKey,
        destinationAmount: isCrossCurrency ? state.destinationAmount : currentSourceAmount,
        exchangeRate: isCrossCurrency ? state.exchangeRate : 1,
        isManualRate: state.isManualRate,
        convert,
        setManualDestinationAmount,
        reset
    };
};
