import { PRECISION } from '@budgie/contracts';
import { useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

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
    const latestRequestId = useRef(0);

    const convert = (sourceAmount: number, sourceInstrumentId: number, destinationInstrumentId: number) => {
        if (sourceInstrumentId === destinationInstrumentId || sourceInstrumentId === 0 || destinationInstrumentId === 0) {
            setIsCrossCurrency(false);
            setState(INITIAL_STATE);

            return;
        }

        setIsCrossCurrency(true);

        if (sourceAmount <= 0) {
            setState(previous => ({ ...previous, destinationAmount: 0, exchangeRate: previous.exchangeRate }));

            return;
        }

        latestRequestId.current += 1;
        const requestId = latestRequestId.current;
        const sourceAmountInMicroUnits = Math.round(sourceAmount * PRECISION);

        void exchangeRatesService.convert(sourceInstrumentId, destinationInstrumentId, sourceAmountInMicroUnits).then(result => {
            if (requestId !== latestRequestId.current) {
                return result;
            }

            setState({ destinationAmount: result.amount / PRECISION, exchangeRate: result.exchangeRate, isManualRate: false });

            return result;
        }, emptyFn);
    };

    const setManualDestinationAmount = (sourceAmount: number, destinationAmount: number) => {
        latestRequestId.current += 1;
        const manualRate = sourceAmount > 0 && destinationAmount > 0 ? sourceAmount / destinationAmount : 1;

        setState({ destinationAmount, exchangeRate: manualRate, isManualRate: true });
    };

    const reset = () => {
        setState(INITIAL_STATE);
        setIsCrossCurrency(false);
        latestRequestId.current += 1;
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
