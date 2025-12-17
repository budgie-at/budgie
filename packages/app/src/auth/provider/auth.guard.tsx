import { Redirect, usePathname } from 'expo-router';
import { ReactNode } from 'react';

import { useAuthContext } from '../context/auth.context';

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const { isUnlocked } = useAuthContext();
    const pathname = usePathname();

    if (!isUnlocked && pathname !== '/pin') {
        return <Redirect href="/pin" />;
    }

    return children;
};
