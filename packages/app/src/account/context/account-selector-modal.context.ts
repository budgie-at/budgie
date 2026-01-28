import { AccountTypeEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface AccountSelectorModalParams {
    readonly initialAccountId?: number | null;
    readonly excludeAccountId?: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
    readonly emptyStateDescription?: string;
    readonly onlyActive?: boolean;
}

interface AccountSelectorModalContextInterface {
    openAccountSelector: (params?: AccountSelectorModalParams) => Promise<number | null>;
    resolveAccountSelector: (accountId: number | null) => void;
    currentParams: AccountSelectorModalParams | null;
}

export const AccountSelectorModalContext = createContext<AccountSelectorModalContextInterface>({
    openAccountSelector: () => Promise.resolve(null),
    resolveAccountSelector: emptyFn,
    currentParams: null
});

export const useAccountSelectorModal = () => use(AccountSelectorModalContext);
