import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { AccountSelectorModalContext, AccountSelectorModalParams } from '../context/account-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const AccountSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<AccountSelectorModalParams, number | null>('/account-selector');

    const value = { openAccountSelector: open, resolveAccountSelector: resolve, currentParams };

    return <AccountSelectorModalContext value={value}>{children}</AccountSelectorModalContext>;
};
