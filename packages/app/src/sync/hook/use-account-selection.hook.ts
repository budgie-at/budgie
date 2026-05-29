import { useState } from 'react';

import { AccountSelectionInterface } from '../interface/account-selection.interface';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { toggleSetItem } from '../util/toggle-set-item.util';

export const useAccountSelection = (): AccountSelectionInterface => {
    const [accountPreviews, setAccountPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

    const setPreviews = (previews: BankAccountPreviewInterface[]) => {
        setAccountPreviews(previews);
        setSelectedAccounts(new Set(previews.filter(preview => preview.hasBankSync).map(preview => preview.externalId)));
    };

    const toggleAccount = (externalId: string) => {
        setSelectedAccounts(prev => toggleSetItem(prev, externalId));
    };

    const selectAllAccounts = () => {
        setSelectedAccounts(new Set(accountPreviews.map(preview => preview.externalId)));
    };

    const deselectAllAccounts = () => {
        setSelectedAccounts(new Set());
    };

    return { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts };
};
