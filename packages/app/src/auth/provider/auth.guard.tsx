import { Redirect, usePathname } from 'expo-router';
import { ReactNode } from 'react';

import { EmptyScreen } from '../../@generic/component/empty-screen/empty-screen';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useAuthContext } from '../context/auth.context';

const LOCKED_ALLOWED_PATHS: ReadonlySet<string> = new Set(['/pin', '/forgot-pin', '/import-backup-pin']);

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

    if (!isUnlocked && !LOCKED_ALLOWED_PATHS.has(pathname)) {
        return <Redirect href="/pin" />;
    }

    return children;
};
