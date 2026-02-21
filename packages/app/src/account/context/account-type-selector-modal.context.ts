import { AccountTypeEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface AccountTypeSelectorModalParams {
    readonly currentType: AccountTypeEnum;
}

export type AccountTypeSelectorResult = AccountTypeEnum | null;

interface AccountTypeSelectorModalContextInterface {
    openAccountTypeSelector: (params: AccountTypeSelectorModalParams) => Promise<AccountTypeSelectorResult>;
    resolveAccountTypeSelector: (result: AccountTypeSelectorResult) => void;
    currentParams: AccountTypeSelectorModalParams | null;
}

export const AccountTypeSelectorModalContext = createContext<AccountTypeSelectorModalContextInterface>({
    openAccountTypeSelector: () => Promise.resolve(null),
    resolveAccountTypeSelector: emptyFn,
    currentParams: null
});

export const useAccountTypeSelectorModal = () => use(AccountTypeSelectorModalContext);
