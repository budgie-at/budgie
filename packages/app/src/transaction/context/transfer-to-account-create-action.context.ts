import { createContext, use } from 'react';

import type { AccountSelectorCreateActionInterface } from '../../account/interface/account-selector-create-action.interface';

export const TransferToAccountCreateActionContext = createContext<AccountSelectorCreateActionInterface | null>(null);

export const useTransferToAccountCreateAction = (): AccountSelectorCreateActionInterface | null =>
    use(TransferToAccountCreateActionContext);
