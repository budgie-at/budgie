import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import type { ConvertedAmountStateInterface } from '../interface/converted-amount-state.interface';
import type { ConvertedAmountInterface } from '../interface/converted-amount.interface';

export const useConvertedAmount = (
    fromInstrumentId: number,
    toInstrumentId: number,
    amountInMicroUnits: number
): ConvertedAmountInterface | null => {
    const [convertedAmount, setConvertedAmount] = useState<ConvertedAmountStateInterface | null>(null);
    const isSameCurrency = fromInstrumentId === toInstrumentId;
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();

    useEffect(() => {
        let cancelled = false;

        if (!isSameCurrency) {
            void exchangeRatesService.convertStrict(fromInstrumentId, toInstrumentId, amountInMicroUnits).then(result => {
                if (!cancelled) {
                    setConvertedAmount({ fromInstrumentId, toInstrumentId, amountInMicroUnits, result });
                }

                return result;
            }, emptyFn);
        }

        return () => {
            cancelled = true;
        };
    }, [isSameCurrency, fromInstrumentId, toInstrumentId, amountInMicroUnits, exchangeRatesUpdatedAt]);

    if (isSameCurrency) {
        return null;
    }

    const isCurrentConversion =
        convertedAmount?.fromInstrumentId === fromInstrumentId &&
        convertedAmount.toInstrumentId === toInstrumentId &&
        convertedAmount.amountInMicroUnits === amountInMicroUnits;

    return isCurrentConversion ? convertedAmount.result : null;
};
