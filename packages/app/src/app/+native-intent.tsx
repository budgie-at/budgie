import { getShareExtensionKey } from 'expo-share-intent';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../@generic/constant/app-atom-registry.constant';
import { RECEIPT_SCAN_ACTION } from '../receipt/constant/receipt-scan-action.constant';
import { receiptScanRequestAtom } from '../receipt/constant/receipt-scan-request-atom.constant';
import { ReceiptSourceEnum } from '../receipt/enum/receipt-source.enum';
import { enableBankingCallbackUrlAtom } from '../sync/constant/enable-banking-callback-url-atom.constant';
import { resolveEnableBankingCallbackUrl } from '../sync/utils/resolve-enable-banking-callback-url.util';

import type { NativeIntent } from 'expo-router';

export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ path }) => {
    if (path.includes(getShareExtensionKey())) {
        return null;
    }

    if (path.includes(RECEIPT_SCAN_ACTION)) {
        appAtomRegistry.set(receiptScanRequestAtom, ReceiptSourceEnum.CAMERA);

        return null;
    }

    const enableBankingCallbackUrl = resolveEnableBankingCallbackUrl(path);

    if (isDefined(enableBankingCallbackUrl)) {
        appAtomRegistry.set(enableBankingCallbackUrlAtom, enableBankingCallbackUrl);

        return '/create-account/ENABLE_BANKING';
    }

    return path;
};
