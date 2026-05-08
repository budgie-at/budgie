import { PRECISION } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useEffect, useRef, useState } from 'react';

import { getErrorMessage, isPositiveNumber } from '@rnw-community/shared';

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
const UNMOUNTED_REQUEST_ID = -1;
const logger = getLogger('useCurrencyConversion');

export const useCurrencyConversion = (): UseCurrencyConversionResult => {
    const [state, setState] = useState<ConversionState>(INITIAL_STATE);
    const [isCrossCurrency, setIsCrossCurrency] = useState(false);
    const latestRequestId = useRef(0);

    useEffect(
        () => () => {
            latestRequestId.current = UNMOUNTED_REQUEST_ID;
        },
        []
    );

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

        latestRequestId.current += 1;
        const requestId = latestRequestId.current;
        const sourceAmountInMicroUnits = convertToMicroUnits(sourceAmount);

        void exchangeRatesService.convert(sourceInstrumentId, destinationInstrumentId, sourceAmountInMicroUnits).then(
            result => {
                if (requestId !== latestRequestId.current || latestRequestId.current === UNMOUNTED_REQUEST_ID) {
                    return result;
                }

                setState({ destinationAmount: result.amount / PRECISION, exchangeRate: result.exchangeRate, isManualRate: false });

                return result;
            },
            (error: unknown) => {
                logger.error('convert:failed', { errorMessage: getErrorMessage(error) });
            }
        );
    };

    const setManualDestinationAmount = (sourceAmount: number, destinationAmount: number) => {
        latestRequestId.current += 1;
        const manualRate = isPositiveNumber(sourceAmount) && isPositiveNumber(destinationAmount) ? sourceAmount / destinationAmount : 1;

        setIsCrossCurrency(true);
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
