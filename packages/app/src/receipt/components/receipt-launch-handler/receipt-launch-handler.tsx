import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useEffectEvent } from 'react';

import { useAuthContext } from '../../../auth/context/auth.context';
import { useReceiptScan } from '../../hook/use-receipt-scan.hook';

export const ReceiptLaunchHandler = () => {
    useQuickActionRouting();

    const { isUnlocked } = useAuthContext();
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const scanReceipts = useReceiptScan();

    const handleShareIntent = useEffectEvent(() => {
        const uris = (shareIntent.files ?? []).map(file => file.path);
        resetShareIntent();
        scanReceipts(uris);
    });

    useEffect(() => {
        if (isUnlocked && hasShareIntent) {
            handleShareIntent();
        }
    }, [isUnlocked, hasShareIntent]);

    return null;
};
