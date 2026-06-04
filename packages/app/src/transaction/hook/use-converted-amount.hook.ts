import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

export const useConvertedAmount = (
    fromInstrumentId: number,
    toInstrumentId: number,
    amountInMicroUnits: number
): { readonly amount: number; readonly exchangeRate: number } | null => {
    const [convertedAmount, setConvertedAmount] = useState<{
        readonly fromInstrumentId: number;
        readonly toInstrumentId: number;
        readonly amountInMicroUnits: number;
        readonly result: { readonly amount: number; readonly exchangeRate: number } | null;
    } | null>(null);
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
