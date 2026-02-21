import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    AccountTypeSelectorModalContext,
    AccountTypeSelectorModalParams,
    AccountTypeSelectorResult
} from '../context/account-type-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const AccountTypeSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<AccountTypeSelectorModalParams, AccountTypeSelectorResult>(
        '/account-type-selector'
    );

    const value = { openAccountTypeSelector: open, resolveAccountTypeSelector: resolve, currentParams };

    return <AccountTypeSelectorModalContext value={value}>{children}</AccountTypeSelectorModalContext>;
};
