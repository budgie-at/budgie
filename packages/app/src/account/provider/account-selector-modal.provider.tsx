import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { AccountSelectorModalContext, AccountSelectorModalParams } from '../context/account-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const AccountSelectorModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<AccountSelectorModalParams | null>(null);
    const resolverRef = useRef<((accountId: number | null) => void) | null>(null);

    const openAccountSelector = (params?: AccountSelectorModalParams): Promise<number | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/account-selector');
        });

    const resolveAccountSelector = (accountId: number | null) => {
        resolverRef.current?.(accountId);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openAccountSelector, resolveAccountSelector, currentParams };

    return <AccountSelectorModalContext value={value}>{children}</AccountSelectorModalContext>;
};
