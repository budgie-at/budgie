import { useAtom } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useEffectEvent } from 'react';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAuthContext } from '../../../auth/context/auth.context';
import { RECEIPT_SCAN_ACTION } from '../../constant/receipt-scan-action.constant';
import { receiptScanRequestAtom } from '../../constant/receipt-scan-request-atom.constant';
import { useReceiptScan } from '../../hook/use-receipt-scan.hook';
import { ReceiptScanService } from '../../service/receipt-scan.service';

import type { Action } from 'expo-quick-actions';

export const ReceiptLaunchHandler = () => {
    const { isUnlocked } = useAuthContext();
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const [isScanRequested, setIsScanRequested] = useAtom(receiptScanRequestAtom);
    const processReceipts = useReceiptScan();

    const handleQuickAction = (action: Action) => {
        const isScanAction = action.id === RECEIPT_SCAN_ACTION;

        if (isScanAction) {
            setIsScanRequested(true);
        }

        return isScanAction;
    };

    useQuickActionRouting(handleQuickAction);

    const handleShareIntent = useEffectEvent(() => {
        const uris = (shareIntent.files ?? []).map(file => file.path);
        resetShareIntent();
        processReceipts(uris);
    });

    const handleScanRequest = useEffectEvent(() => {
        setIsScanRequested(false);
        appRuntime.runFork(
            Effect.flatMap(ReceiptScanService, receiptScanService => receiptScanService.scan()).pipe(
                Effect.tap(uris => Effect.sync(() => void processReceipts(uris)))
            )
        );
    });

    useEffect(() => {
        if (isUnlocked && hasShareIntent) {
            handleShareIntent();
        }
    }, [isUnlocked, hasShareIntent]);

    useEffect(() => {
        if (isUnlocked && isScanRequested) {
            handleScanRequest();
        }
    }, [isUnlocked, isScanRequested]);

    return null;
};
