import { useAtom } from '@effect/atom-react/Hooks';
import { useEffect, useEffectEvent } from 'react';

import { pendingReceiptAtom } from '../constant/pending-receipt-atom.constant';

export const usePendingReceipt = () => {
    const [pendingReceipt, setPendingReceipt] = useAtom(pendingReceiptAtom);
    const handleUnmount = useEffectEvent(() => void setPendingReceipt(null));

    useEffect(() => () => void handleUnmount(), []);

    return pendingReceipt;
};
