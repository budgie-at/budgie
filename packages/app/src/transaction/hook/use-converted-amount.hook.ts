import { useEffect, useState } from 'react';

import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

export const useConvertedAmount = (fromInstrumentId: number, toInstrumentId: number, amountInMicroUnits: number): number | undefined => {
    const [convertedAmount, setConvertedAmount] = useState<number | undefined>();
    const isSameCurrency = fromInstrumentId === toInstrumentId;

    useEffect(() => {
        let cancelled = false;

        if (!isSameCurrency) {
            void exchangeRatesService.convert(fromInstrumentId, toInstrumentId, amountInMicroUnits).then(
                result => {
                    if (!cancelled) {
                        setConvertedAmount(result.amount);
                    }

                    return result;
                },
                () => {
                    // Conversion failed, keep undefined
                }
            );
        }

        return () => {
            cancelled = true;
        };
    }, [isSameCurrency, fromInstrumentId, toInstrumentId, amountInMicroUnits]);

    if (isSameCurrency) {
        return undefined; // eslint-disable-line no-undefined -- Same currency needs no conversion
    }

    return convertedAmount;
};
