import { useAtom } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useEffectEvent } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAuthContext } from '../../../auth/context/auth.context';
import { RECEIPT_SCAN_ACTION } from '../../constant/receipt-scan-action.constant';
import { receiptScanRequestAtom } from '../../constant/receipt-scan-request-atom.constant';
import { ReceiptSourceEnum } from '../../enum/receipt-source.enum';
import { useReceiptScan } from '../../hook/use-receipt-scan.hook';
import { ReceiptScanService } from '../../service/receipt-scan.service';

import type { Action } from 'expo-quick-actions';

export const ReceiptLaunchHandler = () => {
    const { isUnlocked } = useAuthContext();
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const [scanSource, setScanSource] = useAtom(receiptScanRequestAtom);
    const processReceipt = useReceiptScan();

    const handleQuickAction = (action: Action) => {
        const isScanAction = action.id === RECEIPT_SCAN_ACTION;

        if (isScanAction) {
            setScanSource(ReceiptSourceEnum.CAMERA);
        }

        return isScanAction;
    };

    useQuickActionRouting(handleQuickAction);

    const handleShareIntent = useEffectEvent(() => {
        const uri = shareIntent.files?.at(0)?.path ?? null;
        resetShareIntent();
        processReceipt(uri);
    });

    const handleScanRequest = useEffectEvent((source: ReceiptSourceEnum) => {
        setScanSource(null);
        appRuntime.runFork(
            Effect.flatMap(ReceiptScanService, receiptScanService => receiptScanService.capture(source)).pipe(
                Effect.tap(uri => Effect.sync(() => void processReceipt(uri)))
            )
        );
    });

    useEffect(() => {
        if (isUnlocked && hasShareIntent) {
            handleShareIntent();
        }
    }, [isUnlocked, hasShareIntent]);

    useEffect(() => {
        if (isUnlocked && isDefined(scanSource)) {
            handleScanRequest(scanSource);
        }
    }, [isUnlocked, scanSource]);

    return null;
};
