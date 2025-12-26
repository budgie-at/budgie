import { BankProviderEnum } from '@budgie/bank-sync';
import { useEffect, useState } from 'react';

import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { bankSyncStorageService } from '../service/bank-sync-storage.service';

const POLL_INTERVAL_MS = 1000;

export const useBankSyncState = (provider: BankProviderEnum) => {
    const [state, setState] = useState<BankSyncStateInterface>(bankSyncStorageService.getState(provider));

    useEffect(() => {
        const interval = setInterval(() => {
            setState(bankSyncStorageService.getState(provider));
        }, POLL_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        };
    }, [provider]);

    return state;
};
