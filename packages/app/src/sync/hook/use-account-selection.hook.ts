import { SyncAccountPreviewInterface } from '@budgie/sync';
import { useState } from 'react';

import { AccountSelectionInterface } from '../interface/account-selection.interface';

export const useAccountSelection = (): AccountSelectionInterface => {
    const [accountPreviews, setAccountPreviews] = useState<SyncAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

    const setPreviews = (previews: SyncAccountPreviewInterface[]) => {
        setAccountPreviews(previews);
        setSelectedAccounts(new Set(previews.filter(preview => preview.hasSync).map(preview => preview.externalId)));
    };

    const onToggle = (externalId: string) => {
        setSelectedAccounts(previous => {
            const next = new Set(previous);
            if (next.has(externalId)) {
                next.delete(externalId);
            } else {
                next.add(externalId);
            }

            return next;
        });
    };

    const onSelectAll = () => {
        setSelectedAccounts(new Set(accountPreviews.map(preview => preview.externalId)));
    };

    const onDeselectAll = () => {
        setSelectedAccounts(new Set());
    };

    return { accountPreviews, selectedAccounts, setPreviews, onToggle, onSelectAll, onDeselectAll };
};
