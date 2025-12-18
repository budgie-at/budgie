import { Redirect, usePathname } from 'expo-router';
import { ReactNode } from 'react';

import { EmptyScreen } from '../../@generic/components/empty-screen/empty-screen';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useAuthContext } from '../context/auth.context';

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const { isUnlocked } = useAuthContext();
    const { isLoading } = useSettingsContext();
    const pathname = usePathname();

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isUnlocked && pathname !== '/pin') {
        return <Redirect href="/pin" />;
    }

    return children;
};
