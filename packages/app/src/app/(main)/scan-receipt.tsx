import * as Effect from 'effect/Effect';
import { useEffect, useEffectEvent } from 'react';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useAuthContext } from '../../auth/context/auth.context';
import { useReceiptScan } from '../../receipt/hook/use-receipt-scan.hook';
import { ReceiptScanService } from '../../receipt/service/receipt-scan.service';

export default function ScanReceiptPage() {
    const { isUnlocked } = useAuthContext();
    const scanReceipts = useReceiptScan();

    const handleScanned = useEffectEvent((uris: readonly string[]) => {
        goBackOrReplace('/');
        scanReceipts(uris);
    });

    useEffect(() => {
        if (isUnlocked) {
            appRuntime.runFork(
                Effect.flatMap(ReceiptScanService, receiptScanService => receiptScanService.scan()).pipe(
                    Effect.catchCause(cause => Effect.as(Effect.logError(cause), [])),
                    Effect.tap(uris => Effect.sync(() => void handleScanned(uris)))
                )
            );
        }
    }, [isUnlocked]);

    return null;
}
