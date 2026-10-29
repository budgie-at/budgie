import { getShareExtensionKey } from 'expo-share-intent';

import { appAtomRegistry } from '../@generic/constant/app-atom-registry.constant';
import { RECEIPT_SCAN_ACTION } from '../receipt/constant/receipt-scan-action.constant';
import { receiptScanRequestAtom } from '../receipt/constant/receipt-scan-request-atom.constant';

import type { NativeIntent } from 'expo-router';

export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ path }) => {
    if (path.includes(getShareExtensionKey())) {
        return null;
    }

    if (path.includes(RECEIPT_SCAN_ACTION)) {
        appAtomRegistry.set(receiptScanRequestAtom, true);

        return null;
    }

    return path;
};
