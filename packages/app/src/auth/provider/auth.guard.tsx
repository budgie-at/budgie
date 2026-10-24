import { Redirect, router, usePathname } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';

import { EmptyScreen } from '../../@generic/component/empty-screen/empty-screen';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useAuthContext } from '../context/auth.context';

const PIN_PATH = '/pin';
const LOCKED_ALLOWED_PATHS: ReadonlySet<string> = new Set([PIN_PATH, '/forgot-pin', '/import-backup-pin']);

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const { isUnlocked } = useAuthContext();
    const { isLoading } = useSettingsContext();
    const pathname = usePathname();
    const [hasBeenUnlocked, setHasBeenUnlocked] = useState(isUnlocked);
    const isLockedOutsidePin = !isUnlocked && !LOCKED_ALLOWED_PATHS.has(pathname);
    const isUnlockedOnPin = isUnlocked && pathname === PIN_PATH;

    if (isUnlocked && !hasBeenUnlocked) {
        setHasBeenUnlocked(true);
    }

    useEffect(() => {
        if (isLockedOutsidePin && hasBeenUnlocked) {
            router.push(PIN_PATH);
        } else if (isUnlockedOnPin && router.canGoBack()) {
            router.back();
        } else if (isUnlockedOnPin) {
            router.replace('/');
        }
    }, [hasBeenUnlocked, isLockedOutsidePin, isUnlockedOnPin]);

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (isLockedOutsidePin && !hasBeenUnlocked) {
        return <Redirect href={PIN_PATH} />;
    }

    return children;
};
